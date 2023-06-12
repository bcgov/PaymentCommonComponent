import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { isSaturday, isSunday, format } from 'date-fns';
import FormData from 'form-data';
import * as _ from 'underscore';

import { Readable } from 'stream';
import { getLambdaEventSource } from './utils/eventTypes';
import { AppModule } from '../app.module';
import { FileTypes, ALL } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../parse/entities/file-ingestion-rules.entity';
import { ParseService } from '../parse/parse.service';
import { DailyAlertRO } from '../parse/ro/daily-alert.ro';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TransactionService } from '../transaction/transaction.service';

export interface ParseEvent {
  eventType: string;
  filename: string;
}

const API_URL = process.env.API_URL;
let axiosInstance: AxiosInstance;

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
    axiosInstance = axios.create({ baseURL: API_URL });
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
  const s3 = app.get(S3ManagerService);
  const posService = app.get(PosDepositService);
  const cashService = app.get(CashDepositService);

  const processAllFiles = async () => {
    appLogger.log('Processing all files...');
    try {
      const fileList =
        (await s3.listBucketContents(
          `pcc-integration-data-files-${process.env.RUNTIME_ENV}`
        )) || [];

      const allUploadedFiles: string[] = [];
      const uploadedPosFiles = await posService.findAllUploadedFiles();
      const uploadedCashFiles = await cashService.findAllUploadedFiles();
      const uploadedTransactionFiles =
        await transactionService.findAllUploadedFiles();

      // Filter out files that have already been parsed
      uploadedPosFiles.map((file) => {
        allUploadedFiles.push(file.pos_deposit_source_file_name);
      });

      uploadedCashFiles.map((file) => {
        allUploadedFiles.push(file.cash_deposit_source_file_name);
      });

      uploadedTransactionFiles.map((file) => {
        allUploadedFiles.push(file.transaction_source_file_name);
      });

      const parseList = _.difference(fileList, allUploadedFiles);

      // TODO [CCFPCM-318] Excluded LABOUR2 files that are DDF, needs implementation
      const finalParseList = parseList.filter(
        (filename) => !filename?.includes('LABOUR2')
      );
      appLogger.log('Creating daily upload for today if needed');

      await axiosInstance.post(
        '/v1/parse/daily-upload',
        {
          date: new Date(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Parse & Save only files that have not been parsed before
      for (const filename of finalParseList) {
        appLogger.log(`Parsing ${filename}..`);
        const event = { eventType: 'all', filename: filename };
        await processEvent(event);
      }

      const alertsSentResponse = await axiosInstance.post(
        '/v1/parse/daily-upload/alert',
        {
          date: new Date(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      appLogger.log(alertsSentResponse.data.data);
      const alertsSent: DailyAlertRO = alertsSentResponse.data.data;
      const programAlerts = alertsSent.dailyAlertPrograms;
      for (const alert of programAlerts) {
        if (!alert.success) {
          appLogger.log(`Daily Upload for ${alert.program} is incomplete`);
        }
        if (alert.alerted) {
          appLogger.log(
            '\n\n=========Alerts Sent for Daily Upload: =========\n'
          );
          appLogger.error(
            `Sent an alert to prompt ${alert.program} to complete upload`
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

      const file = await s3.getObjectStream(
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
        throw new Error(`File does not reference to any programs: ${filename}`);
      })();

      if (!currentRule) {
        throw new Error('No rule associated');
      }

      const fileType = (() => {
        if (
          currentRule.cashChequesFilename &&
          filename.includes(currentRule.cashChequesFilename)
        ) {
          return FileTypes.TDI17;
        }
        if (
          currentRule.posFilename &&
          filename.includes(currentRule.posFilename)
        ) {
          return FileTypes.TDI34;
        }
        if (
          currentRule.transactionsFilename &&
          filename.includes(currentRule.transactionsFilename)
        ) {
          return FileTypes.SBC_SALES;
        }
        throw new Error('Unknown file type: ' + filename);
      })();

      try {
        appLogger.log('Call endpoint to upload file...', filename);
        const formData = new FormData();
        formData.append('file', Readable.from(file), filename);
        formData.append('fileName', filename);
        formData.append('fileType', fileType);
        formData.append('program', ministry);
        await axiosInstance.post('/v1/parse/upload-file', formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
      } catch (err) {
        appLogger.log('\n\n=========Errors with File Upload: =========\n');
        appLogger.error(`Error with uploading file ${filename}`);
        appLogger.error(
          err instanceof AxiosError
            ? `Validation Errors: ${err.response?.data?.errorMessage}`
            : `Validation Errors present in the file`
        );
      }
    } catch (err) {
      appLogger.error(err);
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
