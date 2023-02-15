import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import * as _ from 'underscore';
import { getLambdaEventSource } from './utils/eventTypes';
import { parseGarms } from './utils/parseGarms';
import { parseTDI } from './utils/parseTDI';
import { AppModule } from '../app.module';
import { FileNames, FileTypes, LOCAL, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { TDI34Details } from '../flat-files';
import { TDI17Details } from '../flat-files/tdi17/TDI17Details';
import { AppLogger } from '../logger/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { TransactionEntity } from '../transaction/entities/transaction.entity';
import { SBCGarmsJsonJson } from '../transaction/interface';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionService } from '../transaction/transaction.service';

export interface LocalEvent {
  eventType: string;
  filename: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event?: unknown, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const transactionService = app.get(TransactionService);
  const paymentMethodService = app.get(PaymentMethodService);
  const s3 = app.get(S3ManagerService);
  const posService = app.get(PosDepositService);
  const cashService = app.get(CashDepositService);
  appLogger.log({ event });

  const processLocalFiles = async () => {
    try {
      const fileList =
        (await s3.listBucketContents(
          `pcc-integration-data-files-${process.env.NODE_ENV}`
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

      // TODO: Excluded LABOUR2 files that are DDF, needs implementation
      const finalParseList = parseList.filter(
        (filename) => !filename?.includes('LABOUR2')
      );

      // Parse & Save only files that have not been parsed before
      for (const filename of finalParseList) {
        appLogger.log(`Parsing ${filename}..`);
        const event = { eventType: 'local', filename: filename };
        await processEvent(event);
      }
    } catch (err) {
      appLogger.error(err);
    }
  };

  const processEvent = async (event: unknown) => {
    try {
      const eventType = getLambdaEventSource(event);
      const filename = (() => {
        if (eventType === LOCAL) {
          const localEvent = event as LocalEvent;
          return localEvent.filename;
        }

        // TODO: use types here
        // TODO: Implement S3 event notification processing
        // if (eventType === 'isS3') {
        //   const s3NotificationEvent = event;
        //   return s3NotificationEvent?.records[0]?.s3?.object?.key;
        // }
        process.exit(0);
      })();

      const file = await s3.getObject(
        `pcc-integration-data-files-${process.env.NODE_ENV}`,
        filename
      );

      const fileType = (() => {
        if (filename.includes(FileNames.TDI17)) return FileTypes.TDI17;
        if (filename.includes(FileNames.TDI34)) return FileTypes.TDI34;
        if (filename.includes(FileNames.SBC_SALES)) return FileTypes.SBC_SALES;
        throw new Error('Unknow file type: ' + filename);
      })();

      const ministry = (() => {
        if (filename.includes(Ministries.LABOUR)) return Ministries.LABOUR;
        if (filename.includes(Ministries.SBC)) return Ministries.SBC;
        throw new Error(
          'File does not reference to any ministries: ' + filename
        );
      })();

      if (fileType === FileTypes.SBC_SALES) {
        const paymentMethods = await paymentMethodService.getPaymentMethods();
        const garmsSales: TransactionEntity[] = await parseGarms(
          (await JSON.parse(
            file.Body?.toString() || '{}'
          )) as SBCGarmsJsonJson[],
          filename,
          paymentMethods
        );

        garmsSales.map(
          async (data: TransactionEntity) =>
            await transactionService.saveTransaction(data)
        );
      }

      if (fileType === FileTypes.TDI17 || fileType === FileTypes.TDI34) {
        const parsed = parseTDI(
          fileType,
          Buffer.from(file.Body?.toString() || '').toString(),
          ministry,
          filename
        );

        if (fileType === FileTypes.TDI34) {
          const tdi34Details = parsed as TDI34Details[];
          tdi34Details.map(
            async (item: TDI34Details) =>
              await posService.createPOSDepositEntity(
                new POSDepositEntity(item)
              )
          );
        }

        if (fileType === FileTypes.TDI17) {
          const tdi17Details = parsed as TDI17Details[];
          tdi17Details.map(
            async (item: TDI17Details) =>
              await cashService.createCashDeposit(new CashDepositEntity(item))
          );
        }
      }
    } catch (err) {
      appLogger.error(err);
    }
  };

  const eventRouting = event as LocalEvent;
  if (eventRouting?.eventType === 'make') {
    await processLocalFiles();
    return;
  }

  await processEvent(event);
};
