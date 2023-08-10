import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';

export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = new AppLogger();
  appLogger.setContext('Parser Lambda');
  const parseService = app.get(ParseService);
  appLogger.log({ event, _context }, 'PARSE EVENT');
  const automatedReconciliationEnabled = !process.env.DISABLE_LOCAL_RECONCILE;
  const isLocal: boolean = process.env.RUNTIME_ENV === 'local';
  try {
    await parseService.processAllFiles(
      event,
      isLocal,
      automatedReconciliationEnabled
    );
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
