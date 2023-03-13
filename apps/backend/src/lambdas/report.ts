import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ReportConfig } from '../reporting/interfaces';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (event: ReportConfig, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reportingService = app.get(ReportingService);

  const appLogger = app.get(AppLogger);
  appLogger.log({ context });
  await reportingService.generateReport(event);
  await reportingService.generateDailySummary(event);
};
