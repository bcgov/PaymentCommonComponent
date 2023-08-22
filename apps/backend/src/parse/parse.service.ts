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
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from '../notification/entities/program-daily-upload.entity';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';
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
    @Inject(MailService)
    private readonly mailService: MailService,
    @Inject(SnsManagerService)
    private readonly snsService: SnsManagerService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
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
                  child.value?.[errantIdColumnName] ||
                  child.value?.metadata?.[errantIdColumnName]
                } - Issue with ${
                  child.children?.[0]?.property
                }: ${Object.values(child.children?.[0]?.constraints ?? {}).join(
                  ', '
                )}`
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
    // validate the filename - this must follow a specific format to be valid
    validateSbcGarmsFileName(fileName);
    // Creates an array of Transaction Entities
    const fileDate = extractDateFromTXNFileName(fileName);

    const garmsSales = parseGarms(
      (await JSON.parse(contents ?? '{}')) as SBCGarmsJson[],
      fileName,
      paymentMethods,
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
      throw new Error(errorMessage);
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
      throw new Error(errorMessage);
    }
    return {
      cashDeposits,
      fileDate: (header as TDI17Header).creation_date,
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
    const cashDepositsDto = posEntities.map((p) => new PosDepositDTO(p));
    const list = new PosDepositListDTO(cashDepositsDto);

    try {
      await validateOrReject(list);
    } catch (e: unknown) {
      const errorMessage = this.handleValidationError(
        e,
        fileName,
        'Source File Line',
        'source_file_line'
      );
      throw new Error(errorMessage);
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
   * First step in the parsing process. Checks for files in the bucket, and then checks if they have been parsed before.
   * @param event
   */
  async processAllFiles(event: S3Event) {
    const eventFileList = event.Records.map(
      (r: S3EventRecord) => r.s3.object.key
    );

    const fileList: (string | undefined)[] =
      (await this.s3.listBucketContents(
        `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
      )) ?? [];

    this.appLogger.log(`Found ${fileList.length} files in bucket...`);

    try {
      const allFiles = await this.getAllFiles();

      this.appLogger.log(
        `Found ${allFiles.length} files already uploaded to the  database...`
      );

      const allUploadedFiles: string[] = allFiles.map((f) => f.sourceFileName);

      const parseList =
        event.Records.length === 0
          ? _.difference(fileList, allUploadedFiles)
          : _.difference(eventFileList, allUploadedFiles);

      // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
      const finalParseList = parseList.filter(
        (filename) => !filename?.includes('LABOUR2')
      );

      this.appLogger.log(`Found ${finalParseList.length} files to parse...`);

      // Parse & Save only files that have not been parsed before
      for (const filename of finalParseList) {
        this.appLogger.log(`Parsing ${filename}..`);
        if (filename) {
          await this.parseFileFromS3(filename);
        }
      }
    } catch (err) {
      this.appLogger.error(err);
    }
  }

  async parseFileFromS3(fileKey: string): Promise<FileUploadedEntity | void> {
    try {
      const bucket = `pcc-integration-data-files-${process.env.RUNTIME_ENV}`;

      //file source is either bcm, or the txn data from a program
      const fileSource = fileKey.split('/')[0];
      const filename = fileKey.split('/')[1];
      // program is the ministry - there will be txn fileSource data and bcm fileSource data for each ministry

      const file = await this.s3.getObject(bucket, `${fileSource}/${filename}`);

      //Get all existing rules for each program
      const rules: FileIngestionRulesEntity[] =
        await this.notificationService.getAllRules();

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

      try {
        this.appLogger.log('Call endpoint to upload file...', filename);
        const savedFile = await this.uploadAndParseFile(
          `${fileSource}/${filename}`,
          currentRule?.program as Ministries,
          fileType,
          Buffer.from(file.Body?.toString() ?? '')
        );
        return savedFile;
      } catch (err) {
        this.appLogger.log('\n\n=========Errors with File Upload: =========\n');
        const errorMessage =
          err instanceof BadRequestException
            ? `Validation Errors in file ${filename}: ${err.message}`
            : `Validation Errors present in the file ${filename}`;

        this.appLogger.error({ errorMessage });

        await this.notificationService.validationAlert(
          currentRule?.program as Ministries,
          filename,
          fileType,
          errorMessage
        );
      }
    } catch (err) {
      this.appLogger.error(err);
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

  async uploadAndParseFile(
    fileName: string,
    program: string,
    fileType: FileTypes,
    buffer: Buffer
  ): Promise<FileUploadedEntity | void> {
    this.appLogger.log(`Parsing ${fileName}`);
    const contents = buffer.toString();

    const allFiles: FileUploadedEntity[] = await this.getAllFiles();
    const allFilenames = new Set(allFiles.map((f) => f.sourceFileName));

    if (allFilenames.has(fileName)) {
      throw new BadRequestException({
        message: 'Invalid filename, this already exists',
      });
    }

    // Throws an error if no rules exist for the specified program
    const rules: FileIngestionRulesEntity =
      await this.notificationService.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }

    // Creates a new daily status for the rule, if none exist, so that files can be tracked
    // after parse, before DB insert
    const getOrCreateDailyUploadRecord = async (date: string) => {
      const dailies = await this.commenceDailyUpload(date);
      return dailies.find((d) => d.rule.id === rules.id);
    };

    // Checks if the daily is successful by identifying if files are missing
    const updateDailyRecordSuccess = async (date: string) => {
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
    };

    try {
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
          dailyUpload: await getOrCreateDailyUploadRecord(txnFileDate),
        });

        this.appLogger.log(`Transaction count: ${txnFile.length}`);

        await this.transactionService.saveTransactions(
          txnFile.map((sale) => ({
            ...sale,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
        await updateDailyRecordSuccess(txnFileDate);
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
          dailyUpload: await getOrCreateDailyUploadRecord(fileDate),
        });

        this.appLogger.log(`Cash Deposits count: ${cashDeposits.length}`);
        await this.cashDepositService.saveCashDepositEntities(
          cashDeposits.map((deposit) => ({
            ...deposit,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
        await updateDailyRecordSuccess(fileDate);
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
          dailyUpload: await getOrCreateDailyUploadRecord(fileDate),
        });

        this.appLogger.log(`POS Deposits count: ${posEntities.length}`);

        await this.posDepositService.savePOSDepositEntities(
          posEntities.map((deposit) => ({
            ...deposit,
            fileUploadedEntityId: fileToSave.id,
            timestamp: deposit.timestamp,
          }))
        );
        await updateDailyRecordSuccess(fileDate);
        return fileToSave;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Error with processing ${fileName}`;
      this.appLogger.log(message);
      throw new BadRequestException({ message });
    }
  }
}
