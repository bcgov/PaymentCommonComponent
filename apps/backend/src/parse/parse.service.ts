import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
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
import { FileIngestionRulesEntity } from './entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from './entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from './entities/program-daily-upload.entity';
import { FileTypes, ParseArgsTDI } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { TDI17Details, TDI34Details } from '../flat-files';
import { parseGarms } from '../lambdas/utils/parseGarms';
import { parseTDI } from '../lambdas/utils/parseTDI';
import { AppLogger } from '../logger/logger.service';
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
    @Inject(PosDepositService)
    private readonly posDepositService: PosDepositService,
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @Inject(CashDepositService)
    private cashDepositService: CashDepositService,
    @Inject(S3ManagerService)
    private s3: S3ManagerService,
    @InjectRepository(FileUploadedEntity)
    private uploadedRepo: Repository<FileUploadedEntity>,
    @InjectRepository(FileIngestionRulesEntity)
    private ingestionRulesRepo: Repository<FileIngestionRulesEntity>,
    @InjectRepository(ProgramDailyUploadEntity)
    private programDailyRepo: Repository<ProgramDailyUploadEntity>
  ) {}

  /**
   * Determines if a daily status is successful or not based on the incoming rules
   * @param rule
   * @param files Files uploaded on the day
   * @returns Success or no
   */
  determineDailySuccess(
    rule: FileIngestionRulesEntity,
    files: FileUploadedEntity[]
  ): {
    success: boolean;
    hasTdi17: boolean;
    hasTdi34: boolean;
    hasTransactionFile: boolean;
  } {
    const { cashChequesFilename, posFilename, transactionsFilename } = rule;
    const hasTdi17 = !!cashChequesFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.TDI17)
      : true;
    const hasTdi34 = !!posFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.TDI34)
      : true;
    const hasTransactionFile = !!transactionsFilename
      ? files?.some((file) => file.sourceFileType === FileTypes.SBC_SALES)
      : true;
    const success = hasTdi17 && hasTdi34 && hasTransactionFile;
    return {
      success,
      hasTdi17,
      hasTdi34,
      hasTransactionFile,
    };
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
      return parseTDI({ type, fileName, program, fileContents });
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
    const garmsSales = await parseGarms(
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

  /**
   * Gets all existing rules for each program
   * @returns List of Rules
   */
  async getAllRules(): Promise<FileIngestionRulesEntity[]> {
    return this.ingestionRulesRepo.find();
  }

  /**
   * Gets a single rule for a specific program
   * @param program SBC or LABOUR for now
   * @returns A set of rules for a program, or failure
   */
  async getRulesForProgram(program: string): Promise<FileIngestionRulesEntity> {
    return this.ingestionRulesRepo.findOneOrFail({
      where: {
        program,
      },
    });
  }

  /**
   * Gets the daily status for a specified date for the specified rule
   * @param rule
   * @param date
   * @returns A daily upload entity or nothing
   */
  async getDailyForRule(
    rule: FileIngestionRulesEntity,
    date: Date
  ): Promise<ProgramDailyUploadEntity | null> {
    return this.programDailyRepo.findOne({
      relations: ['rule', 'files'],
      where: {
        dailyDate: format(date, 'yyyy-MM-dd'),
        rule: {
          id: rule.id,
        },
      },
    });
  }

  /**
   * Creates a new daily entity for the specified rule for a specified date
   * @param rule
   * @param date
   * @returns
   */
  async createNewDaily(
    rule: FileIngestionRulesEntity,
    date: Date
  ): Promise<ProgramDailyUploadEntity> {
    try {
      const newDaily: Partial<ProgramDailyUploadEntity> = {
        dailyDate: format(date, 'yyyy-MM-dd'),
        success: false,
        retries: 0,
        rule,
      };
      const daily = this.programDailyRepo.create(newDaily);
      return this.saveDaily(daily);
    } catch (e) {
      throw new Error('Error saving daily upload');
    }
  }

  /**
   * Saves an existing daily with presumably new information
   * @param daily Daily with updated information
   * @returns ProgramDailyUploadEntity
   */
  async saveDaily(
    daily: ProgramDailyUploadEntity
  ): Promise<ProgramDailyUploadEntity> {
    return this.programDailyRepo.save(daily);
  }
  /**
   * Gets the daily upload for today, or creates one if it doesn't exist
   */
  async processAllFiles() {
        this.appLogger.log('Processing all files...');
        try {
          const fileList =
            (await this.s3.listBucketContents(
              `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
            )) || [];

          const allFiles = await this.getAllFiles();
          const allUploadedFiles: string[] = allFiles.map(
            (f) => f.sourceFileName
          );

          const parseList = _.difference(fileList, allUploadedFiles);

          // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
          const finalParseList = parseList.filter(
            (filename) => !filename?.includes('LABOUR2')
          );
          this.appLogger.log('Creating daily upload for today if needed');

          await this.commenceDailyUpload(new Date());
          // await axios.post(
          //   `${API_URL}/v1/parse/daily-upload`,
          //   {
          //     date: new Date(),
          //   },
          //   {
          //     headers: {
          //       'Content-Type': 'application/json',
          //     },
          //   }
          // );

          // Parse & Save only files that have not been parsed before
          for (const filename of finalParseList) {
            this.appLogger.log(`Parsing ${filename}..`);
            const event = { eventType: 'all', filename: filename };
            await this.processEvent(event);
          }

          // const alertsSentResponse = await axiosInstance.post(
          //   '/v1/parse/daily-upload/alert',
          //   {
          //     date: new Date(),
          //   },
          //   {
          //     headers: {
          //       'Content-Type': 'application/json',
          //     },
          //   }
          // );
          // appLogger.log(alertsSentResponse.data.data);
          // const alertsSent: DailyAlertRO = alertsSentResponse.data.data;
          const alertsSent = await this.dailyUploadAlert(new Date());

          const programAlerts = alertsSent.dailyAlertPrograms;
          for (const alert of programAlerts) {
            if (!alert.success) {
              this.appLogger.log(`Daily Upload for ${alert.program} is incomplete`);
              !alert.files.hasTdi17 &&
                this.appLogger.log(`${alert.program} is missing a TDI17 file`);
              !alert.files.hasTdi34 &&
                this.appLogger.log(`${alert.program} is missing a TDI34 file`);
              !alert.files.hasTransactionFile &&
                this.appLogger.log(
                  `${alert.program} is missing a Transactions file`
                );
            }
            if (alert.alerted) {
              this.appLogger.log(
                '\n\n=========Alerts Sent for Daily Upload: =========\n'
              );
              this.appLogger.error(
                `Sent an alert to prompt ${alert.program} to complete upload`
              );
            }
          }
        } catch (err) {
          this.appLogger.error(err);
        }
  }
  /**
   * process file dropped in s3 bucket
   * @param bucket
   * @param key
   * @param eventType
   */
  async processEvent(bucket: string, key: string, eventType: string) {
    this.appLogger.log(`Processing event type: ${eventType}`);
    try {
      const file = await this.s3.getObject(bucket, key);

      let currentRule: FileIngestionRulesEntity | null = null;

      const rules = await this.getAllRules();
      const ministry = (() => {
        for (const rule of rules) {
          if (key.includes(rule.program)) {
            currentRule = rule;
            return rule.program;
          }
        }
        throw new Error(`File does not reference to any programs: ${key}`);
      })();

      if (!currentRule) {
        throw new Error('No rule associated');
      }

      const fileType = (() => {
        if (
          currentRule.cashChequesFilename &&
          key.includes(currentRule.cashChequesFilename)
        ) {
          return FileTypes.TDI17;
        }
        if (currentRule.posFilename && key.includes(currentRule.posFilename)) {
          return FileTypes.TDI34;
        }
        if (
          currentRule.transactionsFilename &&
          key.includes(currentRule.transactionsFilename)
        ) {
          return FileTypes.SBC_SALES;
        }
        throw new Error('Unknown file type: ' + key);
      })();

      try {
        this.appLogger.log('Call endpoint to upload file...', key);
        await this.uploadAndParseFile(
          { fileName: key, fileType, program: ministry },
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
        this.appLogger.error(`Error with uploading file ${key}`);
        this.appLogger.error(
          err instanceof AxiosError
            ? `Validation Errors: ${err.response?.data?.errorMessage}`
            : `Validation Errors present in the file`
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
  commenceDailyUpload = async (date: Date) => {
    const rules = await this.getAllRules();
    for (const rule of rules) {
      const daily = await this.getDailyForRule(rule, new Date(date));
      if (!daily) {
        await this.createNewDaily(rule, new Date(date));
      }
    }
  };

  dailyUploadAlert = async (date: Date) => {
    const rules = await this.getAllRules();
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await this.getDailyForRule(rule, new Date(date));
      if (!daily) {
        daily = await this.createNewDaily(rule, new Date(date));
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          files: { hasTdi17: true, hasTdi34: true, hasTransactionFile: true },
        });
        continue;
      }
      const successStatus = this.determineDailySuccess(rule, daily.files);
      if (successStatus.success === true) {
        await this.saveDaily({
          ...daily,
          success: true,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          files: { hasTdi17: true, hasTdi34: true, hasTransactionFile: true },
        });
      } else {
        let alerted = false;
        if (daily.retries >= rule.retries) {
          // TODO CCFPCM-441
          alerted = true;
        }
        await this.saveDaily({
          ...daily,
          retries: daily.retries + 1,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: false,
          alerted,
          files: {
            hasTdi17: successStatus.hasTdi17,
            hasTdi34: successStatus.hasTdi34,
            hasTransactionFile: successStatus.hasTransactionFile,
          },
        });
      }
    }
    return { dailyAlertPrograms, date: date };
  };

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
    const rules = await this.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }

    // Creates a new daily status for the rule, if none exist, so that files can be tracked
    let daily = await this.getDailyForRule(rules, new Date());
    if (!daily) {
      daily = await this.createNewDaily(rules, new Date());
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
