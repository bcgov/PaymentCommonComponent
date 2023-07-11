import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AlertsService } from '../alerts/alerts.service';
import * as appModule from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { UploadsService } from '../uploads/uploads.service';

// let axiosInstance: AxiosInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(appModule.AppModule);
  const appLogger = app.get(AppLogger);

  const alertService = app.get(AlertsService);
  const uploadService = app.get(UploadsService);

  const rules = await uploadService.getAllUploadRules();
  const filesCheck = await alertService.checkDailyFiles(rules);
  const dailyAlert = await alertService.dailyUploadAlert(new Date(), rules);

  console.log(filesCheck, dailyAlert);
  appLogger.log('Alert Lambda Handler', { event });
};
