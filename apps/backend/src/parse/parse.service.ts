import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import { CashDepositDTO, CashDepositsListDTO } from './dto/cash-deposit.dto';
import {
  GarmsTransactionDTO,
  GarmsTransactionList,
} from './dto/garms-transaction.dto';
import { PosDepositDTO, PosDepositListDTO } from './dto/pos-deposit.dto';
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
import { S3ManagerService } from '../s3-manager/s3-manager.service';
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
    @Inject(S3ManagerService)
    private readonly s3: S3ManagerService,
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
  async parseFile(s3File: S3File) {
    // check the program rule for the file to determine the program
    // TODO: rename program to ministryClient
    const program =
      Ministries[s3File.programRule.program as keyof typeof Ministries];

    // used to map the txn data to the deposit data
    const locations = await this.locationService.findMinistryLocations(program);
    // the try/catch wrapper will catch the line level validation errors, as well as errors related to parsing and saving the file, and then will alert via notification service
    try {
      // SBC garms files are specific to the program ministry SBC so they do not require the program to be spedified - only file+metadata and the static locations and payments methods are required to parse
      if (s3File.fileType === FileTypes.SBC_SALES) {
        await this.parseAndValidateSBCGarms(locations, s3File);
      }

      if (s3File.fileType === FileTypes.TDI34) {
        await this.parseAndValidateTDICardsFile(locations, program, s3File);
      }
      if (s3File.fileType === FileTypes.TDI17) {
        await this.parseAndValidateTDICashFile(locations, program, s3File);
      }
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
   * Transforms fixed width files into json - this function is not specific to the filetype (can be TDI34 or TDI17)
   * @param s3File an aws S3 file with metadata and contents
   * @param program the specific ministry-client
   * @returns parsed header and body of the file
   **/
  async parseGenericTDI(
    s3File: S3File,
    program: Ministries
  ): Promise<{
    header: TDI34Header | TDI17Header;
    parsed: TDI34Details[] | TDI17Details[];
  }> {
    try {
      const header = parseTDIHeader(
        s3File.fileType,
        s3File.contents.toString()
      );
      const parsed = parseTDI({
        type: s3File.fileType,
        fileName: s3File.filename,
        program,
        fileContents: Buffer.from(s3File.contents.toString() || '').toString(),
        header,
      });
      return { header, parsed };
    } catch (e) {
      // line level vaidation errors
      const errorMessage = this.handleValidationError(
        e,
        s3File.filename,
        'Source File Line',
        'source_file_line'
      );
      throw new BadRequestException(errorMessage);
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
  ): Promise<TransactionEntity[]> {
    // used to map the txn data to deposit data
    const paymentMethods = await this.paymentMethodService.getPaymentMethods();

    this.appLogger.log('Parse and store SBC Sales in DB...', file.filename);
    // validate the filename - this must follow a specific format to be valid
    validateSbcGarmsFileName(file.filename);

    // SBC garms files do not contain a header with the date, so we extract it from the filename
    const fileDate = extractDateFromTXNFileName(file.filename);

    try {
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
      // Converts to DTOs strictly for validation purposes
      // after parsing and formatting the data, we validate the data against the Transaction DTO
      const garmsSalesDTO = entities.map((t) => new GarmsTransactionDTO(t));
      const validatedEntities = new GarmsTransactionList(garmsSalesDTO);
      await validateOrReject(validatedEntities);

      // after validating - save a record of the file to the database
      const savedFile = await this.uploadService.saveFile(
        file,
        fileDate,
        entities
      );

      this.appLogger.log(`Transaction count: ${entities.length}`);

      // if file save is successful, save the transaction entities to the database
      const txns = savedFile
        ? await this.transactionService.saveTransactions(
            entities.map((sale) => ({
              ...sale,
              fileUploadedEntityId: savedFile.id,
            }))
          )
        : [];
      return txns;
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
  /**
   * Parses TDI17 files, validates them, and translates to CashDepositEntity
   * @param locations Array of MinistryLocationEntities - used to map between txn data and deposit data
   * @param program SBC or Labour for now, based on filename
   * @param file S3File object - contains the filename, metadata and contents (Buffer)
   * @returns An array of CashDepositEntities that have been saved into the db
   */
  async parseAndValidateTDICashFile(
    locations: MinistryLocationEntity[],
    program: Ministries,
    file: S3File
  ): Promise<CashDepositEntity[]> {
    try {
      this.appLogger.log(
        'Parse and store Cash Deposit data in DB...',
        file.filename
      );
      // parse the header and body of the file into json (original format is fixed width)
      const { header, parsed } = await this.parseGenericTDI(file, program);
      const fileDate = (header as TDI17Header).to_date;
      const tdi17Details = parsed as TDI17Details[];

      // map the json to the deposit entity
      const entities: CashDepositEntity[] = tdi17Details.map(
        (details) => new CashDepositEntity(details)
      );
      this.appLogger.log(`Cash Deposit count: ${entities.length}`);

      // extract the relevant bank data from the locations
      const banks = locations
        .filter((loc) => loc.source_id === program)
        .flatMap((itm) => itm.banks);
      // map the deposit entity to the dto
      const cashDepositsDto = entities.map(
        (c) =>
          new CashDepositDTO({
            ...c,
            bank: banks.find((bank) => bank.bank_id === c.pt_location_id),
          })
      );
      // validate the data against the  DTO (specific to the deposit type)
      const list = new CashDepositsListDTO(cashDepositsDto);
      await validateOrReject(list);
      // save the file record to the database
      const savedFile = await this.uploadService.saveFile(
        file,
        fileDate,
        entities
      );
      // if file save is successful, save the deposit entities to the database
      const deposits = savedFile
        ? await this.cashDepositService.saveCashDepositEntities(
            entities.map((deposit) => ({
              ...deposit,
              fileUploadedEntityId: savedFile.id,
            }))
          )
        : [];
      return deposits;
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
   * Parses TDI34 files, validates them, and translates to PosDepositEntity
   * @param locations Array of MinistryLocationEntities - used to map between txn data and deposit data
   * @param program SBC or Labour for now, based on filename
   * @param file S3File object - contains the filename, metadata and contents (Buffer)
   * @returns An array of PosDepositEntities that have been saved into the db
   */
  async parseAndValidateTDICardsFile(
    locations: MinistryLocationEntity[],
    program: Ministries,
    file: S3File
  ): Promise<POSDepositEntity[]> {
    try {
      this.appLogger.log(
        'Parse and store POS Deposit data in DB...',
        file.filename
      );
      // parse the header and body of the file into json (original format is fixed width)
      const { header, parsed } = await this.parseGenericTDI(file, program);
      const fileDate = (header as TDI34Header).settlement_date;
      const tdi34Details = parsed as TDI34Details[];

      // map the json to the deposit entity
      const entities = tdi34Details.map(
        (details) => new POSDepositEntity(details)
      );

      // extract the relevant merchant data from the locations
      const merchants = locations
        .filter((loc) => loc.source_id === program)
        .flatMap((itm) => itm.merchants);

      // map the deposit entity to the dto
      const posDepositsDto = entities.map(
        (p) =>
          new PosDepositDTO({
            ...p,
            merchant: merchants.find(
              (merch) => merch.merchant_id === p.merchant_id
            ),
          })
      );
      // validate the data against the  DTO (specific to the deposit type)
      const list = new PosDepositListDTO(posDepositsDto);
      await validateOrReject(list);

      this.appLogger.log(`POS Deposit count: ${entities.length}`);
      // save the file record to the database
      const savedFile = await this.uploadService.saveFile(
        file,
        fileDate,
        entities
      );
      // if file save is successful, save the deposit entities to the database
      const deposits = savedFile
        ? await this.posDepositService.savePOSDepositEntities(
            entities.map((deposit) => ({
              ...deposit,
              fileUploadedEntityId: savedFile.id,
              timestamp: deposit.timestamp,
            }))
          )
        : [];

      return deposits;
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
}
