import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import { CashDepositDTO } from './dto/cash-deposit.dto';
import {
  GarmsTransactionDTO,
  GarmsTransactionList,
} from './dto/garms-transaction.dto';
import { ListDTO } from './dto/list.dto';
import { PosDepositDTO } from './dto/pos-deposit.dto';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { UploadService } from './upload.service';
import { FileTypes, Ministries, S3File } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { TDI17Details, TDI34Details } from '../flat-files';
import { TDI17Header } from '../flat-files/tdi17/TDI17Header';
import { TDI34Header } from '../flat-files/tdi34/TDI34Header';
import {
  extractDateFromTXNFileName,
  validateSbcGarmsFileName,
} from '../lambdas/helpers';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { parseTDI, parseTDIHeader } from '../lambdas/utils/parseTDI';
import { MinistryLocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { NotificationService } from '../notification/notification.service';
import { TransactionEntity } from '../transaction/entities';
import { SBCGarmsJson } from '../transaction/interface';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class ParseService {
  constructor(
    @Inject(AppLogger) @Inject(AppLogger) private readonly appLogger: AppLogger,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService,
    @Inject(UploadService)
    private readonly uploadService: UploadService,
    @Inject(PosDepositService)
    private readonly posDepositService: PosDepositService,
    @Inject(CashDepositService)
    private readonly cashDepositService: CashDepositService,
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(LocationService)
    private readonly locationService: LocationService
  ) {
    this.appLogger.setContext(ParseService.name);
  }
  /**
   * Handles validation errors from validateOrReject, identifying which property is failing validation
   * Returns the error message generated
   * @param error Error, in this case an array of ValidationErrors (coming from validateOrReject)
   * @param fileName Filename for logging
   * @param errantColumnName The plain name of the column for identifying the row with the issue
   * @param errantIdColumnName The property name of the column for identifying the row with the issue
   */
  handleValidationError(
    error: unknown,
    fileName: string,
    errantColumnName: string,
    errantIdColumnName: string
  ): string {
    let errorMessage = `Malformed file. Error parsing ${fileName}. Please ensure file is valid.`;

    if (
      Array.isArray(error) &&
      error.every((err) => err instanceof ValidationError)
    ) {
      errorMessage = error[0].children?.length
        ? error[0].children
            .map(
              (child: ValidationError) =>
                `${errantColumnName} ${
                  child.value?.[errantIdColumnName] ??
                  child.value?.metadata?.[errantIdColumnName]
                } - Issue with ${child.children?.[0]
                  ?.property}: ${Object.values(
                  child.children?.[0]?.constraints ?? {}
                ).join(', ')}`
            )
            .join('; ')
        : '';
    }
    return errorMessage;
  }
  /**
   * parses, validates and saves a file + record of file to the database
   * @param s3File aws S3 file with metadata and contents
   */
  async parseFile(s3File: S3File): Promise<unknown> {
    // check the program rule for the file to determine the program
    const program =
      Ministries[s3File.programRule.program as keyof typeof Ministries];

    // used to map the txn data to the deposit data
    const locations = await this.locationService.findMinistryLocations(program);
    // the try/catch wrapper will catch the line level validation errors, as well as errors related to parsing and saving the file, and then will alert via notification service
    try {
      // SBC garms files are specific to the program ministry SBC so they do not require the program to be spedified - only file+metadata and the static locations and payments methods are required to parse
      const { entities, fileDate } =
        s3File.fileType === FileTypes.SBC_SALES
          ? await this.parseAndValidateSBCGarms(locations, s3File)
          : await this.parseTDI(s3File, program);

      const savedFile = await this.uploadService.saveFile(
        s3File,
        fileDate,
        entities.length
      );
      return (
        savedFile &&
        (await this.saveEntities<typeof entities>(
          entities,
          savedFile,
          s3File.fileType,
          locations,
          program
        ))
      );
    } catch (err) {
      this.appLogger.log('\n\n=========Errors with File Upload: =========\n');
      // only show the custom message if it is a BadRequestException
      // otherwise we will just show the generic message to the user
      const errorMessage =
        err instanceof BadRequestException
          ? `${err.message}`
          : `Error parsing ${s3File.filename}. Please ensure all rows are valid.`;
      this.appLogger.error(errorMessage);
      // send the notification email
      await this.notificationService.validationAlert(
        program,
        s3File.filename,
        s3File.fileType,
        errorMessage
      );
    }
  }

  /**
   * Parses file coming from Garms, validating payments and transactions
   * @param file S3File object - contains the filename, metadata and contents (Buffer)
   * @param locations Array of MinistryLocationEntities - used to map between txn data and deposit data
   * @returns Array of transaction entities ready to save to the database
   */
  async parseAndValidateSBCGarms(
    locations: MinistryLocationEntity[],
    file: S3File
  ): Promise<{ entities: TransactionEntity[]; fileDate: string }> {
    // used to map the txn data to deposit data
    const paymentMethods = await this.paymentMethodService.getPaymentMethods();

    this.appLogger.log('Parse and store SBC Sales in DB...', file.filename);
    // validate the filename - this must follow a specific format to be valid
    validateSbcGarmsFileName(file.filename);

    // SBC garms files do not contain a header with the date, so we extract it from the filename
    const fileDate = extractDateFromTXNFileName(file.filename);

    // If the json is malformed, an error is thrown here prior to field validation
    const parsedData = (await JSON.parse(
      file.contents.toString() ?? '{}'
    )) as SBCGarmsJson[];

    // after the file is parsed into proper Json objects, we "reshape" it into data that can be used to create Transaction Entities
    const entities = parseGarms(
      parsedData,
      file.filename,
      paymentMethods,
      locations,
      fileDate
    );

    // check for unknown locations, create stub, and update the entity
    for (const [index, itm] of entities.entries()) {
      if (itm.location.id === undefined) {
        const location = await this.locationService.addStubLocation(
          itm.location_id,
          itm.source_id
        );
        entities[index] = { ...itm, location };
        await this.notificationService.sendLocationNotFoundNotification(
          location,
          file
        );
      }
    }
    const entitiesList = entities.map((t) => new GarmsTransactionDTO(t));
    await this.validateTxnData(entitiesList, file);
    return { entities, fileDate };
  }
  /**
   * sets the entity type and dto type based on the file type
   * @param s3File file with metadata
   * @param ministry ministry-client
   * @returns array of deposit entities and the filedate
   */
  async parseTDI(
    s3File: S3File,
    ministry: Ministries
  ): Promise<
    | { entities: CashDepositEntity[]; fileDate: string }
    | { entities: POSDepositEntity[]; fileDate: string }
  > {
    if (s3File.fileType === FileTypes.TDI17) {
      return await this.parseAndValidateTDIFile<
        CashDepositEntity,
        CashDepositDTO
      >(s3File, ministry);
    } else {
      return await this.parseAndValidateTDIFile<
        POSDepositEntity,
        PosDepositDTO
      >(s3File, ministry);
    }
  }
  /**
   * parses the TDI deposit files
   * Set the entity type and dto type based on the file type
   * @param file file plus metadata
   * @param program ministry-client
   * @returns filedate and array of deposit entities
   */
  async parseAndValidateTDIFile<T, K>(
    file: S3File,
    program: Ministries
  ): Promise<{ entities: T[]; fileDate: string }> {
    this.appLogger.log(
      'Parse and store POS Deposit data in DB...',
      file.filename
    );
    // parse the header and body of the file into json (original format is fixed width)
    const header = parseTDIHeader(file.fileType, file.contents.toString());
    const entities = parseTDI({
      type: file.fileType,
      fileName: file.filename,
      program,
      fileContents: Buffer.from(file.contents.toString() || '').toString(),
      header,
    });

    const fileDate =
      file.fileType === FileTypes.TDI34
        ? (header as TDI34Header).settlement_date
        : (header as TDI17Header).to_date;

    const entitiesList = entities.map((entity) =>
      file.fileType === FileTypes.TDI34
        ? new POSDepositEntity(entity as TDI34Details)
        : new CashDepositEntity(entity as TDI17Details)
    );
    const dtoList = entitiesList.map((entity) =>
      file.fileType === FileTypes.TDI34
        ? new PosDepositDTO(entity)
        : new CashDepositDTO(entity)
    ) as K[];
    const list = new ListDTO<K>(dtoList);

    await this.validateTDI<K>(list, file);

    return { entities: entitiesList as T[], fileDate };
  }

  /**
   * Validate the deposit data - the DTO is passed in to validate the data
   * @param list List of the specific DTO type used to validate
   * @param file file plus metadata
   */
  async validateTDI<T>(list: ListDTO<T>, file: S3File) {
    try {
      await validateOrReject(list);
    } catch (e) {
      // line level vaidation errors
      const errorMessage = this.handleValidationError(
        e,
        file.filename,
        'Source File Line',
        'source_file_line'
      );
      throw new BadRequestException(errorMessage);
    }
  }
  /**
   * Validate the txn data - alert if there are any errors
   * @param garmsSalesDTO DTO for the garms sales data
   * @param file file plus metadata
   */
  async validateTxnData(
    garmsSalesDTO: GarmsTransactionDTO[],
    file: S3File
  ): Promise<void> {
    const validatedEntities = new GarmsTransactionList(garmsSalesDTO);
    try {
      await validateOrReject(validatedEntities);
    } catch (e: unknown) {
      // line level vaidation errors
      const errorMessage = this.handleValidationError(
        e,
        file.filename,
        'Transaction Id',
        'transaction_id'
      );
      throw new BadRequestException(errorMessage);
    }
  }

  async saveEntities<T>(
    entities: T,
    savedFile: FileUploadedEntity,
    type: FileTypes,
    locations: MinistryLocationEntity[],
    program: Ministries
  ): Promise<T> {
    if (type === FileTypes.SBC_SALES) {
      // create and save the transaction entities
      const txns = await this.transactionService.saveTransactions(
        (entities as TransactionEntity[]).map((sale) => ({
          ...sale,
          fileUploadedEntityId: savedFile.id,
        }))
      );

      return txns as T;
    }
    if (type === FileTypes.TDI17) {
      // find the correct bank for each deposit from the location/banks tables
      const banks = locations
        .filter((loc) => loc.source_id === program)
        .flatMap((itm) => itm.banks);
      // create and save the cash deposit entities
      const deposits = await this.cashDepositService.saveCashDepositEntities(
        (entities as CashDepositEntity[]).map((deposit) => ({
          ...deposit,
          fileUploadedEntityId: savedFile.id,
          bank: banks.find((bank) => bank.bank_id === deposit.pt_location_id)!,
        }))
      );

      return deposits as T;
    }
    if (type === FileTypes.TDI34) {
      // find the correct merchant for each deposit from the location/merchants tables
      const merchants = locations
        .filter((loc) => loc.source_id === program)
        .flatMap((itm) => itm.merchants);
      // create and save the deposit entities
      const deposits = await this.posDepositService.savePOSDepositEntities(
        (entities as POSDepositEntity[]).map((deposit) => ({
          ...deposit,
          fileUploadedEntityId: savedFile.id,
          timestamp: deposit.timestamp,
          merchant: merchants.find(
            (merch) => merch.merchant_id === deposit.merchant_id
          )!,
        }))
      );
      return deposits as T;
    }
    return entities;
  }
}
