import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { Ministries } from '../constants';
import { LocationService } from '../location/location.service';
import { ReportConfig } from '../reporting/interfaces';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (event: ReportConfig, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reportingService = app.get(ReportingService);
  const locationService = app.get(LocationService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ context });
  reportingService.generateReport(event);

  const locations = await locationService.getLocationsBySource(Ministries.SBC);
  const location_ids = locations.map((location) => location.id);
  await reportingService.posPaymentposDepositCountCheck(
    location_ids,
    '2023-01-10',
    '2023-01-02'
  );
};
