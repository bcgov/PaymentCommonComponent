import { ReconciliationService } from '../reconciliation/reconciliation.service';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { parseTDI } from './parseFlatFile';

export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);

  const appLogger = app.get(AppLogger);
  const reconService = app.get(ReconciliationService);
  const s3 = app.get(S3ManagerService);
  appLogger.log({ event });
  appLogger.log({ context });

  const filterFiles = (files: any[]) => {
    return files.filter((file: string) => file?.split('/')[0] === event);
  };

  const addDataToDB = (file: string) => {
    s3.getContents('bc-pcc-data-files-local', file).then((parsed) => {
      event === 'transaction'
        ? reconService.addData(
            event,
            JSON.parse(parsed?.Body?.toString() || '')
          )
        : reconService.addData(event, parseTDI(event, parsed.Body?.toString()));
    });
  };

  try {
    filterFiles(
      (await s3.listBucketContents(`bc-pcc-data-files-local`)) || []
    ).map(async (file) => {
      addDataToDB(file);
    });
  } catch (e) {
    appLogger.log(e);
  }
};
