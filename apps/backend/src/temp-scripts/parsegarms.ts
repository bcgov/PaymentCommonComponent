import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { mapMerchantToLocation } from '../common/utils/formatFixedWidth';
import { formatFilePath } from './parseFile';

export const handler = async (
  garmsJson: any[],
  filepath: any,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const s3manager = app.get(S3ManagerService);

  appLogger.log({ context });
  try {
    const s3Params = {
      bucket: `bc-pcc-data-files-local`,
      key: `SALES/JSON/${formatFilePath(filepath)}.json`,
      body: Buffer.from(JSON.stringify(parseSales(garmsJson)))
    };

    await s3manager.putObject(s3Params.bucket, s3Params.key, s3Params.body);
  } catch (e) {
    appLogger.error(e);
  }
};

export const parseSales = (garmsJson: any[]) => {
  return {
    data: garmsJson.map(
      ({
        sales_transaction_id,
        sales_transaction_date,
        payment_total,
        payments,
        source
      }) => ({
        transaction_id: sales_transaction_id,
        transaction_date: sales_transaction_date,
        location: mapMerchantToLocation(parseInt(source.location_id)),
        payments,
        payment_total
      })
    )
  };
};
