import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import * as _ from 'underscore';
import { getLambdaEventSource } from './utils/eventTypes';
import { parseGarms } from './utils/parseGarms';
import { parseTDI } from './utils/parseTDI';
import { AppModule } from '../app.module';
import { FileNames, FileTypes, ALL, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { TDI34Details } from '../flat-files';
import { TDI17Details } from '../flat-files/tdi17/TDI17Details';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TransactionEntity } from '../transaction/entities/transaction.entity';
import { SBCGarmsJson } from '../transaction/interface';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionService } from '../transaction/transaction.service';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { ParseService } from '../parse/parse.service';
import { FileIngestionRulesEntity } from '../parse/entities/file-ingestion-rules.entity';

export interface ParseEvent {
  eventType: string;
  filename: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event?: unknown, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  const transactionService = app.get(TransactionService);
  const paymentMethodService = app.get(PaymentMethodService);
  const s3 = app.get(S3ManagerService);
  const posService = app.get(PosDepositService);
  const cashService = app.get(CashDepositService);

  const paymentMethods = await paymentMethodService.getPaymentMethods();
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
        (filename) => !filename?.includes('LABOUR')
      );

      if (finalParseList.length) {
        axios.request({
          method: 'post',
          maxBodyLength: 100000,
          url: 'http://localhost:3000/api/v1/parse/daily-upload',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            date: new Date(),
          },
        });
      }

      // Parse & Save only files that have not been parsed before
      for (const filename of finalParseList) {
        appLogger.log(`Parsing ${filename}..`);
        const event = { eventType: 'all', filename: filename };
        await processEvent(event);
      }

      if (finalParseList.length) {
        axios.request({
          method: 'post',
          maxBodyLength: 100000,
          url: 'http://localhost:3000/api/v1/parse/daily-upload/alert',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            date: new Date(),
          },
        });
      }

      // call controller for emailing
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
          throw new Error(
            'File does not reference to any ministries: ' + filename
          );
        }
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
          currentRule.cardsFilename &&
          filename.includes(currentRule.cardsFilename)
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

      appLogger.log('Call endpoint to upload file...', filename);
      // if (fileType === FileTypes.SBC_SALES) {
      if (0) {
        const formData = new FormData();
        formData.append('file', Readable.from(file), filename);
        formData.append('fileName', filename);
        formData.append('fileType', fileType);
        formData.append('program', ministry);
        axios.request({
          method: 'post',
          maxBodyLength: 100000,
          url: 'http://localhost:3000/api/v1/parse/upload-file',
          headers: {
            ...formData.getHeaders(),
          },
          data: formData,
        });
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
