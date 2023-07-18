import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AxiosError } from 'axios';
import { isSaturday, isSunday, format } from 'date-fns';
// import FormData from 'form-data';
import * as _ from 'underscore';

// import { Readable } from 'stream';
import { getLambdaEventSource } from './utils/eventTypes';
import { AppModule } from '../app.module';
import { FileTypes, ALL } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../parse/entities/file-ingestion-rules.entity';
import { ParseService } from '../parse/parse.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TransactionService } from '../transaction/transaction.service';
import { MailService } from '../notification/mail.service';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
// import { DailyAlertRO } from '../parse/ro/daily-alert.ro';

export interface ParseEvent {
  eventType: string;
  filename: string;
}

const API_URL = process.env.API_URL;
// let axiosInstance: AxiosInstance;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event?: unknown, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  if (!API_URL) {
    appLogger.error(
      'No API URL present, please check the environment variables'
    );
    return;
  } else {
    // axiosInstance = axios.create({ baseURL: API_URL });
  }

  if (isSaturday(new Date()) || isSunday(new Date())) {
    appLogger.error(
      `Skipping Parsing for ${format(
        new Date(),
        'yyyy-MM-dd'
      )} as it is a weekend`
    );
    return;
  }

  const parseService = app.get(ParseService);
  const transactionService = app.get(TransactionService);
  const posDepositService = app.get(PosDepositService);
  const cashDepositService = app.get(CashDepositService);
  const mailService = app.get(MailService);
  const s3 = app.get(S3ManagerService);

  const processAllFiles = async () => {
    appLogger.log('Processing all files...');
    try {
      const fileList =
        (await s3.listBucketContents(
          `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
        )) || [];

      const allFiles = await parseService.getAllFiles();
      const allUploadedFiles: string[] = allFiles.map((f) => f.sourceFileName);

      const parseList = _.difference(fileList, allUploadedFiles);

      // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
      const finalParseList = parseList.filter(
        (filename) => !filename?.includes('LABOUR2')
      );
      appLogger.log('Creating daily upload for today if needed');

      await commenceDailyUpload(new Date());
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
        appLogger.log(`Parsing ${filename}..`);
        const event = { eventType: 'all', filename: filename };
        await processEvent(event);
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
      const alertsSent = await dailyUploadAlert(new Date());

      const programAlerts = alertsSent.dailyAlertPrograms;
      for (const alert of programAlerts) {
        const errors = [];
        if (!alert.success) {
          const incompleteString = `Daily Upload for ${alert.program} is incomplete.`;
          errors.push(incompleteString);
          alert.missingFiles.forEach((file) => {
            errors.push(
              `Missing a ${file.fileType} file - needs file name "${file.filename}"`
            );
          });
        }

        appLogger.log(errors.join(' '));
        if (alert.alerted) {
          appLogger.log(
            '\n\n=========Alerts Sent for Daily Upload: =========\n'
          );
          appLogger.error(
            `Sent an alert to prompt ${alert.program} to complete upload`
          );
          mailService.sendEmailAlert(
            MAIL_TEMPLATE_ENUM.FILES_MISSING_ALERT,
            process.env.MAIL_SERVICE_DEFAULT_TO_EMAIL || '',
            errors.join(' ')
          );
        }
      }
    } catch (err) {
      appLogger.error(err);
    }
  };

  const processEvent = async (event: unknown) => {
    try {
      const eventType = getLambdaEventSource(event);
      const filename = (() => {
        if (eventType === ALL) {
          const thisEvent = event as ParseEvent;
          return thisEvent.filename;
        }

        // TODO [CCFPCM-397] use types here
        // TODO [CCFPCM-405] Implement S3 event notification processing
        // if (eventType === 'isS3') {
        //   const s3NotificationEvent = event;
        //   return s3NotificationEvent?.records[0]?.s3?.object?.key;
        // }
        process.exit(0);
      })();

      const file = await s3.getObject(
        `pcc-integration-data-files-${process.env.RUNTIME_ENV}`,
        filename
      );

      let currentRule: FileIngestionRulesEntity | null = null;

      const rules = await parseService.getAllRules();
      const ministry = (() => {
        for (const rule of rules) {
          if (filename.includes(rule.program)) {
            currentRule = rule;
            return rule.program;
          }
        }
        throw new Error(`File does not reference any programs: ${filename}`);
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
        appLogger.log('Call endpoint to upload file...', filename);
        await uploadAndParseFile(
          { fileName: filename, fileType, program: ministry },
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
        appLogger.log('\n\n=========Errors with File Upload: =========\n');
        appLogger.error(`Error with uploading file ${filename}`);
        const errorMessage =
          err instanceof AxiosError
            ? `Validation Errors: ${err.response?.data?.errorMessage}`
            : `Validation Errors present in the file`;
        appLogger.error(errorMessage);
        mailService.sendEmailAlert(
          MAIL_TEMPLATE_ENUM.FILE_VALIDATION_ALERT,
          process.env.MAIL_SERVICE_DEFAULT_TO_EMAIL || '',
          errorMessage
        );
      }
    } catch (err) {
      appLogger.error(err);
    }
  };

  /**
   * The below three functions are lifted straight from the parse controller
   * This is to ensure its working within our lambda flows as the API Gateway
   * is currently unable to take requests from the parsing lambda
   */
  const commenceDailyUpload = async (date: Date) => {
    const rules = await parseService.getAllRules();
    for (const rule of rules) {
      const daily = await parseService.getDailyForRule(rule, new Date(date));
      if (!daily) {
        await parseService.createNewDaily(rule, new Date(date));
      }
    }
  };

  const dailyUploadAlert = async (date: Date) => {
    const rules = await parseService.getAllRules();
    const dailyAlertPrograms = [];
    for (const rule of rules) {
      let daily = await parseService.getDailyForRule(rule, new Date(date));
      if (!daily) {
        daily = await parseService.createNewDaily(rule, new Date(date));
      }
      if (daily.success) {
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          missingFiles: [],
        });
        continue;
      }
      const successStatus = parseService.determineDailySuccess(
        rule,
        daily.files
      );
      if (successStatus.success === true) {
        await parseService.saveDaily({
          ...daily,
          success: true,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: true,
          alerted: false,
          missingFiles: [],
        });
      } else {
        let alerted = false;
        if (daily.retries >= rule.retries) {
          // TODO CCFPCM-441
          alerted = true;
        }
        await parseService.saveDaily({
          ...daily,
          retries: daily.retries + 1,
        });
        dailyAlertPrograms.push({
          program: rule.program,
          success: false,
          alerted,
          missingFiles: successStatus.missingFiles,
        });
      }
    }
    return { dailyAlertPrograms, date: date };
  };

  const uploadAndParseFile = async (
    body: { fileName: string; fileType: FileTypes; program: string },
    buffer: Buffer
  ) => {
    const { fileName, fileType, program } = body;
    appLogger.log(`Parsing ${fileName} - ${fileType}`);
    const contents = buffer.toString();

    const allFiles = await parseService.getAllFiles();
    const allFilenames = new Set(allFiles.map((f) => f.sourceFileName));
    if (allFilenames.has(fileName)) {
      throw new BadRequestException({
        message: 'Invalid filename, this already exists',
      });
    }

    // Throws an error if no rules exist for the specified program
    const rules = await parseService.getRulesForProgram(program);
    if (!rules) {
      throw new HttpException(
        `No rules established for program ${program}`,
        HttpStatus.FORBIDDEN
      );
    }

    // Creates a new daily status for the rule, if none exist, so that files can be tracked
    let daily = await parseService.getDailyForRule(rules, new Date());
    if (!daily) {
      daily = await parseService.createNewDaily(rules, new Date());
    }

    try {
      // FileType is based on the filename (from Parser) or from the endpoint body
      if (fileType === FileTypes.SBC_SALES) {
        appLogger.log('Parse and store SBC Sales in DB...', fileName);
        const garmsSales = await parseService.parseGarmsFile(
          contents,
          fileName
        ); // validating step
        const fileToSave = await parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: garmsSales.length,
          dailyUpload: daily,
        });
        appLogger.log(`Transaction count: ${garmsSales.length}`);
        await transactionService.saveTransactions(
          garmsSales.map((sale) => ({
            ...sale,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
      }

      if (fileType === FileTypes.TDI17) {
        appLogger.log('Parse and store TDI17 in DB...', fileName);
        const cashDeposits = await parseService.parseTDICashFile(
          fileName,
          program,
          buffer
        ); // validating step
        const fileToSave = await parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: cashDeposits.length,
          dailyUpload: daily,
        });
        appLogger.log(`Cash Deposits count: ${cashDeposits.length}`);
        await cashDepositService.saveCashDepositEntities(
          cashDeposits.map((deposit) => ({
            ...deposit,
            fileUploadedEntityId: fileToSave.id,
          }))
        );
      }

      if (fileType === FileTypes.TDI34) {
        appLogger.log('Parse and store TDI34 in DB...', fileName);
        const posEntities = await parseService.parseTDICardsFile(
          fileName,
          program,
          buffer
        );
        const fileToSave = await parseService.saveFileUploaded({
          sourceFileType: fileType,
          sourceFileName: fileName,
          sourceFileLength: posEntities.length,
          dailyUpload: daily,
        });
        appLogger.log(`POS Deposits count: ${posEntities.length}`);
        await posDepositService.savePOSDepositEntities(
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
      appLogger.log(message);
      throw new BadRequestException({ message });
    }
  };

  const eventRouting = event as ParseEvent;
  appLogger.log({ eventRouting });
  if (eventRouting?.eventType === 'all') {
    await processAllFiles();
    return;
  }

  try {
    await processEvent(event);
  } catch (err) {
    appLogger.error(err);
  }
};
