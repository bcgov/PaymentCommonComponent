import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

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
    const sales = await parseSales(garmsJson);

    const formatOutput = (filepath: any) => {
      const date = filepath.split('').splice(0, 10).join('');
      filepath = filepath?.split('.').shift();
      filepath = filepath.split('/').pop();
      filepath = filepath.split('.').shift();
      return `${date}/SALES/JSON/${filepath}.json`;
    };

    const s3Params = {
      bucket: `bc-pcc-data-files-local`,
      key: formatOutput(filepath),
      body: Buffer.from(JSON.stringify(sales))
    };

    await s3manager.putObject(s3Params.bucket, s3Params.key, s3Params.body);
  } catch (e) {
    appLogger.error(e);
  }
};

export const parseSales = async (garmsJson: any[]) => {
  const salesData = garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      fiscal_close_date,
      payment_total,
      void_indicator,
      transaction_reference,
      payments,
      source: garmsSource,
      misc: paymentsMisc
    }) => ({
      transaction_id: sales_transaction_id,
      transaction_date: sales_transaction_date,
      fiscal_close_date,
      payment_total,
      misc: {
        void_indicator,
        transaction_reference,
        employee_id: paymentsMisc.employee_id
      },
      source: {
        source_id: garmsSource.source_id,
        location_id: garmsSource.location_id
      },
      payments
    })
  );

  return {
    data: salesData.map((sales: any) => ({
      id: sales.transaction_id,
      total: sales.payment_total,
      date: sales.transaction_date,
      location: sales.source.location_id,
      source_id: sales.source.source_id,
      payments: sales.payments
    }))
  };
};
