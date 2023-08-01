import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';

export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  appLogger.log({ event, _context }, 'PARSE EVENT');

  try {
    await parseService.processAllFiles(event);
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
