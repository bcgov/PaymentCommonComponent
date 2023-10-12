import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Event, S3EventRecord } from 'aws-lambda';
import { validateOrReject, ValidationError } from 'class-validator';
import { Repository } from 'typeorm';
import _ from 'underscore';
import { CashDepositDTO, CashDepositsListDTO } from './dto/cash-deposit.dto';
import {
  GarmsTransactionDTO,
  GarmsTransactionList,
} from './dto/garms-transaction.dto';
import { PosDepositDTO, PosDepositListDTO } from './dto/pos-deposit.dto';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { FileTypes, Ministries } from '../constants';
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
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from '../notification/entities/program-daily-upload.entity';
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
    private readonly locationService: LocationService,
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>
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
    let errorMessage = `Error parsing ${fileName}. Please ensure all rows are valid.`;

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
   * Parses file coming from Garms, validating payments and transactions
   * @param contents String contents from file buffer
   * @param fileName Name of the file
   * @returns Array of transaction entities ready to save to the database
   */
  async parseGarmsFile(
    contents: string,
    fileName: string
  ): Promise<{ txnFile: TransactionEntity[]; txnFileDate: string }> {
    const paymentMethods = await this.paymentMethodService.getPaymentMethods();
    const locations = await this.locationService.findAll();
    // validate the filename - this must follow a specific format to be valid
    validateSbcGarmsFileName(fileName);
    // Creates an array of Transaction Entities
    const fileDate = extractDateFromTXNFileName(fileName);

    const garmsSales = parseGarms(
      (await JSON.parse(contents ?? '{}')) as SBCGarmsJson[],
      fileName,
      paymentMethods,
      locations,
      fileDate
    );

    // Converts to DTOs strictly for validation purposes
    const garmsSalesDTO = garmsSales.map((t) => new GarmsTransactionDTO(t));
    const list = new GarmsTransactionList(garmsSalesDTO);
    try {
      await validateOrReject(list);
    } catch (e: unknown) {
      const errorMessage = this.handleValidationError(
        e,
        fileName,
        'Transaction Id',
        'transaction_id'
      );
      throw new BadRequestException(errorMessage);
    }
    return { txnFile: garmsSales, txnFileDate: fileDate };
  }

  /**
   * Parses TDI17 files, validates them, and translates to CashDepositEntity
   * @param fileName Filename
   * @param program SBC or Labour for now, based on filename
   * @param fileContents Actual buffer from the file
   * @returns An array of CashDepositEntities ready to be saved into the db
   */
  async parseTDICashFile(
    fileName: string,
    program: string,
    fileContents: Buffer
  ): Promise<{ cashDeposits: CashDepositEntity[]; fileDate: string }> {
    const contents = Buffer.from(fileContents.toString() || '').toString();
    const header = parseTDIHeader(FileTypes.TDI17, contents);

    const parsed = parseTDI({
      type: FileTypes.TDI17,
      fileName,
      program,
      fileContents: contents,
      header,
    });

    const tdi17Details = parsed as TDI17Details[];
    const cashDeposits = tdi17Details.map(
      (details) => new CashDepositEntity(details)
    );
    const cashDepositsDto = cashDeposits.map((c) => new CashDepositDTO(c));
    const list = new CashDepositsListDTO(cashDepositsDto);

    try {
      await validateOrReject(list);
    } catch (e: unknown) {
      const errorMessage = this.handleValidationError(
        e,
        fileName,
        'Source File Line',
        'source_file_line'
      );
      throw new BadRequestException(errorMessage);
    }
    return {
      cashDeposits,
      fileDate: (header as TDI17Header).to_date,
    };
  }

  /**
   * Parses TDI34 files, validates them, and translates to PosDepositEntity
   * @param fileName Filename
   * @param program SBC or Labour for now, based on filename
   * @param fileContents Actual buffer from the file
   * @returns An array of PosDepositEntities ready to be saved into the db
   */
  async parseTDICardsFile(
    fileName: string,
    program: string,
    fileContents: Buffer
  ): Promise<{ posEntities: POSDepositEntity[]; fileDate: string }> {
    const header = parseTDIHeader(FileTypes.TDI34, fileContents.toString());
    const parsed = parseTDI({
      type: FileTypes.TDI34,
      fileName,
      program,
      fileContents: Buffer.from(fileContents.toString() || '').toString(),
      header,
    });

    const tdi34Details = parsed as TDI34Details[];
    const posEntities = tdi34Details.map(
      (details) => new POSDepositEntity(details)
    );

    const posDepositsDto = posEntities.map((p) => new PosDepositDTO(p));
    const list = new PosDepositListDTO(posDepositsDto);

    try {
      await validateOrReject(list);
    } catch (e: unknown) {
      const errorMessage = this.handleValidationError(
        e,
        fileName,
        'Source File Line',
        'source_file_line'
      );
      throw new BadRequestException(errorMessage);
    }
    return { posEntities, fileDate: (header as TDI34Header).settlement_date };
  }

  /**
   * Gets all files
   * @returns List of uploaded files
   */
  async getAllFiles(): Promise<FileUploadedEntity[]> {
    return this.uploadedRepo.find();
  }

  /**
   * Saves an entity into the Files Uploaded table.
   * Called whenever a file is uploaded by API or parser lambda
   * @param fileUploaded All the necessary information - sourceFileType, name, length, which daily upload to link to
   * @returns Saved FileUploadedEntity
   */
  async saveFileUploaded(
    fileUploaded: Partial<FileUploadedEntity>
  ): Promise<FileUploadedEntity> {
    return this.uploadedRepo.save(fileUploaded);
  }
  /**
   * First step in the upload/db parsing process. Checks for files in the bucket, and then checks if they have been parsed before.
   * @param event
   */
  async processAllFiles(event: S3Event) {
    // if parsing is called manually we will compare the S3 bucket to the database and parse the difference
    // otherwise the records passed in from the S3 event will be used
    const finalParseList = await this.checkDatabaseForFiles(event);
    for (const filename of finalParseList) {
      this.appLogger.log(`Parsing ${filename}..`);
      if (filename) {
        await this.parseAndValidateFile(filename);
      }
    }
  }
  /**
   * Compares the file list to be parsed with what is already in DB and removes the duplicates
   * @param event
   * @returns
   */
  async checkDatabaseForFiles(event: S3Event): Promise<string[]> {
    const fileList =
      event.Records.length > 0
        ? event.Records.map((r: S3EventRecord) => r.s3.object.key)
        : await this.checkS3ForFiles();

    const allFiles = await this.getAllFiles();

    this.appLogger.log(
      `Found ${allFiles.length} files already uploaded to the  database...`
    );

    const allUploadedFiles: string[] = allFiles.map((f) => f.sourceFileName);

    const parseList = _.difference(fileList, allUploadedFiles);

    const finalParseList = parseList
      .filter((filename) => !filename?.includes('LABOUR2'))
      .filter((itm) => !itm.includes('archive'));

    this.appLogger.log(`Found ${finalParseList.length} files to parse...`);
    return finalParseList;
  }
  /**
   * If no records have been passed in from the event, we will check the S3 bucket for any unparsed files
   * @returns
   */
  async checkS3ForFiles(): Promise<string[]> {
    try {
      return (
        (await this.s3.listBucketContents(
          `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
        )) ?? []
      );
    } catch (err) {
      this.appLogger.error(err);
      throw new Error('Error checking S3 for files');
    }
  }
  /**
   * Find the program rules and validates the file
   * @param filename
   * @param program
   * @returns
   */
  async validateFileList(filename: string, program: Ministries) {
    try {
      const allFiles: FileUploadedEntity[] = await this.getAllFiles();
      const allFilenames = new Set(allFiles.map((f) => f.sourceFileName));

      if (allFilenames.has(filename)) {
        throw new BadRequestException({
          message: 'Invalid filename, this already exists',
        });
      }

      //Get all existing rules for each program
      const rules: FileIngestionRulesEntity[] =
        await this.notificationService.getAllRules();

      // Throws an error if no rules exist for the specified program
      const programRules: FileIngestionRulesEntity =
        await this.notificationService.getRulesForProgram(program);

      if (!rules) {
        throw new HttpException(
          `No rules established for program ${program}`,
          HttpStatus.FORBIDDEN
        );
      }

      const currentRule: FileIngestionRulesEntity | undefined = rules.find(
        (rule) => filename.includes(rule.program)
      );

      if (currentRule === undefined) {
        throw new Error(`File does not reference to any programs: ${filename}`);
      }

      const fileType = (() => {
        //TODO change this to not use the filename to validate
        const requiredFiles = currentRule?.requiredFiles;
        const requiredFile = requiredFiles?.find((rf) =>
          filename.includes(rf.filename)
        );
        if (requiredFile !== undefined) {
          return requiredFile.fileType;
        }

        throw new Error('Unknown file type: ' + filename);
      })();
      return { currentRule, fileType, programRules };
    } catch (e) {
      this.appLogger.error(e);

      throw new Error('Error validating file');
    }
  }
  /**
   * Initiates the validate/upload/parsed process for a file
   * @param fileKey
   * @returns
   */
  //TODO dynamicly retrieve program based on the bucket directory
  async parseAndValidateFile(
    fileKey: string,
    program = Ministries.SBC
  ): Promise<FileUploadedEntity | void> {
    const bucket = `pcc-integration-data-files-${process.env.RUNTIME_ENV}`;

    //file source is either bcm, or the txn data from a program
    const fileSource = fileKey.split('/')[0];
    const filename = fileKey.split('/')[1];
    // program is the ministry - there will be txn fileSource data and bcm fileSource data for each ministry
    const file = await this.s3.getObjectString({
      Bucket: bucket,
      Key: `${fileSource}/${filename}`,
    });

    // will throw validation error based on filename and program rules
    const { currentRule, fileType, programRules } = await this.validateFileList(
      filename,
      program
    );

    const savedFiled = await this.saveFile(
      fileSource,
      filename,
      currentRule,
      fileType,
      programRules,
      file
    );

    return savedFiled;
  }

  async saveFile(
    fileSource: string,
    filename: string,
    currentRule: FileIngestionRulesEntity,
    fileType: FileTypes,
    programRules: FileIngestionRulesEntity,
    file: string
  ) {
    try {
      // saves and validates the data row by row
      const savedFile = await this.parseAndSaveFile(
        `${fileSource}/${filename}`,
        currentRule?.program as Ministries,
        fileType,
        Buffer.from(file),
        programRules
      );
      return savedFile;
    } catch (err) {
      this.appLogger.log('\n\n=========Errors with File Upload: =========\n');
      // only show the custom message if it is a BadRequestException
      // otherwise we will just show the generic message to the user
      const errorMessage =
        err instanceof BadRequestException
          ? `${err.message}`
          : `Error parsing ${filename}. Please ensure all rows are valid.`;
      this.appLogger.error(errorMessage);

      await this.notificationService.validationAlert(
        currentRule?.program as Ministries,
        filename,
        fileType,
        errorMessage
      );
    }
  }
  /**
   * The below three functions are lifted straight from the parse controller
   * This is to ensure its working within our lambda flows as the API Gateway
   * is currently unable to take requests from the parsing lambda
   */
  async commenceDailyUpload(date: string): Promise<ProgramDailyUploadEntity[]> {
    const rules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();
    const dailies: ProgramDailyUploadEntity[] = [];
    for (const rule of rules) {
      let daily: ProgramDailyUploadEntity | null =
        await this.notificationService.getProgramDailyUploadRecord(rule, date);
      if (!daily) {
        daily = await this.notificationService.createNewDailyUploadRecord(
          rule,
          date
        );
        daily.rule = rule;
      }
      dailies.push(daily);
    }
    return dailies;
  }
  /**
   * Creates a new daily status for the rule, if none exist, so that files can be tracked after parse, before DB insert
   * @param rules
   * @param date
   * @returns
   */
  async getOrCreateDailyUploadRecord(
    rules: FileIngestionRulesEntity,
    date: string
  ) {
    const dailies = await this.commenceDailyUpload(date);
    return dailies.find((d) => d.rule.id === rules.id);
  }

  /**
   * Checks if the daily is successful by identifying if files are missing
   * @param rules
   * @param date
   */
  async updateDailyRecordSuccess(
    rules: FileIngestionRulesEntity,
    date: string
  ) {
    const daily = await this.notificationService.getProgramDailyUploadRecord(
      rules,
      date
    );
    if (!daily) {
      throw new Error('Error');
    }
    const missingFiles = this.notificationService.findMissingDailyFiles(
      rules,
      daily.files
    );
    if (missingFiles.length === 0) {
      daily.success = true;
      await this.notificationService.saveProgramDailyUpload(daily);
    }
  }
  /**
   * Parse the flat file/TXN json files and save them to the database
   * @param fileName
   * @param program
   * @param fileType
   * @param buffer
   * @param rules
   * @returns
   */
  async parseAndSaveFile(
    fileName: string,
    program: string,
    fileType: FileTypes,
    buffer: Buffer,
    rules: FileIngestionRulesEntity
  ): Promise<FileUploadedEntity | void> {
    this.appLogger.log(`Parsing ${fileName}`);
    const contents = buffer.toString();

    // FileType is based on the filename (from Parser) or from the endpoint body
    if (fileType === FileTypes.SBC_SALES) {
      this.appLogger.log('Parse and store SBC Sales in DB...', fileName);

      const { txnFile, txnFileDate } = await this.parseGarmsFile(
        contents,
        fileName
      );

      const fileToSave = await this.saveFileUploaded({
        sourceFileType: fileType,
        sourceFileName: fileName,
        sourceFileLength: txnFile.length,
        dailyUpload: await this.getOrCreateDailyUploadRecord(
          rules,
          txnFileDate
        ),
      });

      this.appLogger.log(`Transaction count: ${txnFile.length}`);

      await this.transactionService.saveTransactions(
        txnFile.map((sale) => ({
          ...sale,
          fileUploadedEntityId: fileToSave.id,
        }))
      );
      await this.updateDailyRecordSuccess(rules, txnFileDate);
      return fileToSave;
    }

    if (fileType === FileTypes.TDI17) {
      this.appLogger.log('Parse and store TDI17 in DB...', fileName);

      const { cashDeposits, fileDate } = await this.parseTDICashFile(
        fileName,
        program,
        buffer
      );

      // validating step
      const fileToSave = await this.saveFileUploaded({
        sourceFileType: fileType,
        sourceFileName: fileName,
        sourceFileLength: cashDeposits.length,
        dailyUpload: await this.getOrCreateDailyUploadRecord(rules, fileDate),
      });

      this.appLogger.log(`Cash Deposits count: ${cashDeposits.length}`);
      await this.cashDepositService.saveCashDepositEntities(
        cashDeposits.map((deposit) => ({
          ...deposit,
          fileUploadedEntityId: fileToSave.id,
        }))
      );
      await this.updateDailyRecordSuccess(rules, fileDate);
      return fileToSave;
    }

    if (fileType === FileTypes.TDI34) {
      this.appLogger.log('Parse and store TDI34 in DB...', fileName);
      // first parse the file in order to extract the date from the header
      const { posEntities, fileDate } = await this.parseTDICardsFile(
        fileName,
        program,
        buffer
      );

      const fileToSave = await this.saveFileUploaded({
        sourceFileType: fileType,
        sourceFileName: fileName,
        sourceFileLength: posEntities.length,
        dailyUpload: await this.getOrCreateDailyUploadRecord(rules, fileDate),
      });

      this.appLogger.log(`POS Deposits count: ${posEntities.length}`);

      await this.posDepositService.savePOSDepositEntities(
        posEntities.map((deposit) => ({
          ...deposit,
          fileUploadedEntityId: fileToSave.id,
          timestamp: deposit.timestamp,
        }))
      );
      await this.updateDailyRecordSuccess(rules, fileDate);
      return fileToSave;
    }
  }
}
