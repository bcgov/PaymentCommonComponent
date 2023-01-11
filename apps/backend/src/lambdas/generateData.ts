import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { parseTDI } from './utils/parseTDI';
import { parseGarms } from './utils/parseGarms';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { POSDeposit } from '../reconciliation/classes/pos-deposit';
import { CashDeposit } from '../reconciliation/classes/cash-deposit';
import { ReconciliationService } from '../reconciliation/reconciliation.service';

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
  const addDataToDB = (file: any) => {
    s3.getContents(`bc-pcc-data-files-${process.env.NODE_ENV}`, file).then(
      async (rawFile) => {
        const program = file?.split('_')[1];

        if (event === 'transaction') {
          reconService.mapSalesTransaction(
            parseGarms(JSON.parse(rawFile.Body?.toString() || ''))
          );
        } else {
          const parsed = parseTDI(
            event,
            Buffer.from(rawFile.Body?.toString() || '').toString(),
            program,
            file
          );
          parsed && event === 'TDI17'
            ? await reconService.mapCashDeposit(
                parsed.map((itm: any) => new CashDeposit(itm))
              )
            : parsed &&
              event === 'TDI34' &&
              (await reconService.mapPOSDeposit(
                parsed.map((itm: any) => new POSDeposit(itm))
              ));
        }
      }
    );
  };
  try {
    filterFiles(
      (await s3.listBucketContents(
        `bc-pcc-data-files-${process.env.NODE_ENV}`
      )) || []
    ).map(async (file) => {
      addDataToDB(file);
    });
  } catch (e) {
    appLogger.log(e);
  }
};
