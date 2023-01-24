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

// TODO - clean this up - this is for dev only
export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);

  const appLogger = app.get(AppLogger);
  const reconService = app.get(ReconciliationService);
  const s3 = app.get(S3ManagerService);
  appLogger.log({ event });
  appLogger.log({ context });

  const createTDIEntries = async (file: any, filename: string) => {
    const program = filename?.split('_')[1];
    const parsed = parseTDI(
      event,
      Buffer.from(file.Body?.toString() || '').toString(),
      program,
      filename
    );

    parsed && event === 'TDI34'
      ? await reconService.mapPOSDeposit(
          parsed.map((itm: any) => new POSDepositEntity(itm))
        )
      : parsed &&
        (await reconService.mapCashDeposit(
          parsed.map((itm: any) => new CashDepositEntity(itm))
        ));
  };

  const createGarmsJson = async (file: any) => {
    const fileData = file.Body?.toString();
    fileData &&
      (await reconService.mapSalesTransaction(
        await parseGarms(JSON.parse(fileData))
      ));
  };

  const getBucketContents = async (fileList: any[]) => {
    const filtered = fileList.filter((itm) => itm.split('/')[0] === event);
    filtered.map(async (itm) => {
      const file = await s3.getContents(
        `bc-pcc-data-files-${process.env.NODE_ENV}`,
        itm
      );
      if (event === 'transaction') {
        createGarmsJson(file);
      } else {
        createTDIEntries(file, itm);
      }
    });
  };

  try {
    await getBucketContents(
      (await s3.listBucketContents(
        `bc-pcc-data-files-${process.env.NODE_ENV}`
      )) || []
    );
  } catch (e) {
    appLogger.error(e);
  }
};
