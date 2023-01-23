import { ReconciliationService } from './../reconciliation/reconciliation.service';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';

export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.get(ReconciliationService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });
};
