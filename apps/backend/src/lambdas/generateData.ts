import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { parseTDI } from './utils/parseTDI';
import { parseGarms } from './utils/parseGarms';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import {
  CashDepositEntity,
  POSDepositEntity
} from './../reconciliation/entities';
import { getLambdaEventSource } from './utils/eventTypes';
import { FileNames, FileTypes, LOCAL, Ministries } from '../constants';
import { TDI17Details } from '../flat-files/tdi17/TDI17Details';
import { TDI34Details } from '../flat-files';
import { IGarmsJson } from '../reconciliation/interface';
import { CashService } from '../cash/cash.service';
import { PosService } from '../pos/pos.service';
import * as _ from 'underscore';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const reconService = app.get(ReconciliationService);
  const s3 = app.get(S3ManagerService);
  const posService = app.get(PosService);
  const cashService = app.get(CashService);
  appLogger.log({ event });

  const processLocalFiles = async () => {
    try {
      const fileList =
        (await s3.listBucketContents(
          `pcc-integration-data-files-${process.env.NODE_ENV}`
        )) || [];

      const uploadedPosFiles = await posService.findAllUploadedFiles();
      const uploadedCashFiles = await cashService.findAllUploadedFiles();

      const allUploadedFiles: string[] = [];
      uploadedPosFiles.map((file) => {
        allUploadedFiles.push(file.pos_deposit_source_file_name);
      });

      uploadedCashFiles.map((file) => {
        allUploadedFiles.push(file.cash_deposit_source_file_name);
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

  const processEvent = async (event: any) => {
    try {
      const eventType = getLambdaEventSource(event);
      const filename = (() => {
        if (eventType === LOCAL) {
          return event?.filename;
        }
        if (eventType === 'isS3') {
          // TODO: use types here
          const s3NotificationEvent = event;
          return s3NotificationEvent?.records[0]?.s3?.object?.key;
        }
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
        // IGarmsJson should not be in reconciliation module
        const garmsSales = (await JSON.parse(
          file.Body?.toString() || '{}'
        )) as IGarmsJson[];
        // TODO: mapSalesTransaction should be typed to garms sales JSON format.
        reconService.mapSalesTransaction(parseGarms(garmsSales));
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
          const tdi34Entities = tdi34Details.map(
            (item) => new POSDepositEntity(item)
          );
          // TODO: Needs to go to it's own service / repository
          await reconService.mapPOSDeposit(tdi34Entities);
        }

        if (fileType === FileTypes.TDI17) {
          const tdi17Details = parsed as TDI17Details[];
          const tdi17Entities = tdi17Details.map(
            (item) => new CashDepositEntity(item)
          );
          // TODO: Needs to go to it's own service / repository
          await reconService.mapCashDeposit(tdi17Entities);
        }
      }
    } catch (err) {
      appLogger.error(err);
    }
  };

  if(event?.eventType === 'make') {
    await processLocalFiles();
    return;
  }

  await processEvent(event);
};
