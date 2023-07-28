import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Event, S3EventRecord } from 'aws-lambda';
import { validateOrReject, ValidationError } from 'class-validator';
import { format } from 'date-fns';
import { Repository } from 'typeorm';
import _ from 'underscore';
import { CashDepositDTO, CashDepositsListDTO } from './dto/cash-deposit.dto';
import {
  GarmsTransactionDTO,
  GarmsTransactionList,
} from './dto/garms-transaction.dto';
import { PosDepositDTO, PosDepositListDTO } from './dto/pos-deposit.dto';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { extractDateFromTXNFileName } from '../common/utils/format';
import { FileTypes, ParseArgsTDI } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { TDI17Details, TDI34Details } from '../flat-files';
import { extractDateFromBCMFileName } from '../lambdas/helpers';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
import { NotificationService } from '../notification/notification.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TransactionEntity } from '../transaction/entities';
import { SBCGarmsJson } from '../transaction/interface';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class ParseService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
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
    @Inject(NotificationService)
    private readonly alertService: NotificationService,
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>
  ) {}

  async findAllUploadedFiles(): Promise<FileUploadedEntity[]> {
    return await this.uploadedRepo.find();
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
                }: ${Object.values(child.children?.[0]?.constraints || {}).join(
                  ', '
                )}`
            )
            .join('; ')
        : '';
    }
    return errorMessage;
  }

  /**
   * Function used by `flat-file` endpoint to parse TDI
   */
  async readAndParseFile({
    type,
    fileName,
    program,
    fileContents,
  }: ParseArgsTDI): Promise<unknown> {
    try {
      //TODO upload? Or parse to the db?
      return parseTDI({
        type,
        fileName,
        program,
        fileContents: Buffer.from(fileContents || '').toString(),
      });
    } catch (err) {
      this.appLogger.error(err, 'Error parsing file');
      throw err;
    }
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
  ): Promise<TransactionEntity[]> {
    const paymentMethods = await this.paymentMethodService.getPaymentMethods();
    // Creates an array of Transaction Entities
    const garmsSales = parseGarms(
      (await JSON.parse(contents || '{}')) as SBCGarmsJson[],
      fileName,
      paymentMethods
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
    return garmsSales;
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
  ): Promise<CashDepositEntity[]> {
    const parsed = parseTDI({
      type: FileTypes.TDI17,
      fileName,
      program,
      fileContents: Buffer.from(fileContents.toString() || '').toString(),
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
    return cashDeposits;
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
  ): Promise<POSDepositEntity[]> {
    const parsed = parseTDI({
      type: FileTypes.TDI34,
      fileName,
      program,
      fileContents: Buffer.from(fileContents.toString() || '').toString(),
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
    return posEntities;
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

  async processAllFiles(event: S3Event) {
    event.Records.length === 0
      ? this.appLogger.log(
          'No Records in Event...checking for files in bucket...'
        )
      : this.appLogger.log(`Processing ${event.Records.length} files...`);

    const eventFileList = event.Records.map(
      (r: S3EventRecord) => r.s3.object.key
    );

    const fileList =
      (await this.s3.listBucketContents(
        `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
      )) || [];

    this.appLogger.log(
      `Found ${fileList ? fileList.length : 0} files in bucket...`
    );

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

      this.appLogger.log(`Found ${parseList.length} files to parse...`);
      // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
      const finalParseList = parseList.filter(
        (filename) => !filename?.includes('LABOUR2')
      );
      this.appLogger.log('Creating daily upload for today if needed');

      await this.commenceDailyUpload(new Date());
      // Parse & Save only files that have not been parsed before
      for (const filename of finalParseList) {
        this.appLogger.log(`Parsing ${filename}..`);
        if (filename) await this.parseFileFromS3(filename);
      }
    } catch (err) {
      this.appLogger.error(err);
    }
  }

  async parseFileFromS3(fileKey: string) {
    try {
      const bucket = `pcc-integration-data-files-${process.env.RUNTIME_ENV}`;
      const program = fileKey.split('/')[0];
      const filename = fileKey.split('/')[1];
      const file = await this.s3.getObject(bucket, `${program}/${filename}`);

      let currentRule: FileIngestionRulesEntity | null = null;

      const rules = await this.alertService.getAllRules();
      const ministry = (() => {
        for (const rule of rules) {
          if (filename.includes(rule.program)) {
            currentRule = rule;
            return rule.program;
          }
        }
        throw new Error(`File does not reference to any programs: ${filename}`);
      })();

      if (!currentRule) {
        throw new Error('No rule associated');
      }

      const fileType = (() => {
        const requiredFiles = currentRule?.requiredFiles;
        const requiredFile = requiredFiles?.find((rf) =>
          filename.includes(rf.filename)
        );
        if (!!requiredFile) {
          return requiredFile.fileType;
        }
        throw new Error('Unknown file type: ' + filename);
      })();

      try {
        this.appLogger.log('Call endpoint to upload file...', filename);
        await this.uploadAndParseFile(
          { fileName: `${program}/${filename}`, fileType, program: ministry },
          Buffer.from(file.Body?.toString() || '')
        );
        // const formData = new FormData();
        // formData.append('file', Readable.from(file), filename);
        // formData.append('fileName', filename);
        // formData.append('fileType', fileType);
        // formData.append('program', ministry);
        // await axiosInstance.post('/v1/parse/upload-file', formData, {
        //   headers: {
        //     ...formData.getHeaders(),
        //   },
        // });
      } catch (err) {
        this.appLogger.log('\n\n=========Errors with File Upload: =========\n');
        this.appLogger.error(`Error with uploading file ${filename}`);
        const errorMessage =
          err instanceof BadRequestException
            ? `Validation Errors in file ${filename}: ${err}`
            : `Validation Errors present in the file ${filename}`;
        this.appLogger.error(errorMessage);
        const alertDestinations = await this.mailService.getAlertDestinations(
          ministry,
          [filename]
        );
        if (!alertDestinations.length) {
          return;
        }
        await this.mailService.sendEmailAlertBulk(
          MAIL_TEMPLATE_ENUM.FILE_VALIDATION_ALERT,
          alertDestinations.map((ad) => ad),
          [
            {
              fieldName: 'date',
              content: format(new Date(), 'yyyy-MM-dd'),
            },
            {
              fieldName: 'ministryDivision',
              content: ministry,
            },
            {
              fieldName: 'error',
              content: errorMessage,
            },
          ]
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
  async commenceDailyUpload(date: Date) {
    const rules = await this.alertService.getAllRules();
    for (const rule of rules) {
      const daily = await this.alertService.getDailyForRule(
        rule,
        new Date(date)
      );
      if (!daily) {
        await this.alertService.createNewDaily(rule, new Date(date));
      }
    }
  }

  async uploadAndParseFile(
    body: { fileName: string; fileType: FileTypes; program: string },
    buffer: Buffer
  ) {
    const { fileName, fileType, program } = body;
    this.appLogger.log(`Parsing ${fileName} - ${fileType}`);
    const contents = buffer.toString();

    const allFiles = await this.getAllFiles();
    const allFilenames = new Set(allFiles.map((f) => f.sourceFileName));
    if (allFilenames.has(fileName)) {
      throw new BadRequestException({
        message: 'Invalid filename, this already exists',
      });
    }

    // Throws an error if no rules exist for the specified program
    const rules = await this.alertService.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }
    const dailyDate =
      fileType === FileTypes.SBC_SALES
        ? extractDateFromTXNFileName(fileName)
        : extractDateFromBCMFileName(fileName);

    let daily = await this.alertService.getDailyForRule(rules, dailyDate);

    // Creates a new daily status for the rule, if none exist, so that files can be tracked
    if (!daily) {
      daily = await this.alertService.createNewDaily(rules, dailyDate);
    }

    try {
      // FileType is based on the filename (from Parser) or from the endpoint body
      if (fileType === FileTypes.SBC_SALES) {
        this.appLogger.log('Parse and store SBC Sales in DB...', fileName);
        const garmsSales = await this.parseGarmsFile(contents, fileName); // validating step
        const fileToSave = await this.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: garmsSales.length,
          fileCreatedDate: new Date(dailyDate),
          dailyUpload: daily,
        });
        this.appLogger.log(`Transaction count: ${garmsSales.length}`);
        await this.transactionService.saveTransactions(
          garmsSales.map((sale) => ({
            ...sale,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
      }

      if (fileType === FileTypes.TDI17) {
        this.appLogger.log('Parse and store TDI17 in DB...', fileName);
        const cashDeposits = await this.parseTDICashFile(
          fileName,
          program,
          buffer
        ); // validating step
        const fileToSave = await this.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: cashDeposits.length,
          fileCreatedDate: new Date(dailyDate),
          dailyUpload: daily,
        });
        this.appLogger.log(`Cash Deposits count: ${cashDeposits.length}`);
        await this.cashDepositService.saveCashDepositEntities(
          cashDeposits.map((deposit) => ({
            ...deposit,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
      }

      if (fileType === FileTypes.TDI34) {
        this.appLogger.log('Parse and store TDI34 in DB...', fileName);
        const posEntities = await this.parseTDICardsFile(
          fileName,
          program,
          buffer
        );
        const fileToSave = await this.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: posEntities.length,
          fileCreatedDate: new Date(dailyDate),
          dailyUpload: daily,
        });
        this.appLogger.log(`POS Deposits count: ${posEntities.length}`);
        await this.posDepositService.savePOSDepositEntities(
          posEntities.map((deposit) => ({
            ...deposit,
            fileUploadedEntityId: fileToSave.id,
            timestamp: deposit.timestamp,
          }))
        );
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
