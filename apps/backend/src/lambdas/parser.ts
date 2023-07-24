import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { ParseEvent } from './interface';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';

const API_URL = process.env.API_URL;
// let axiosInstance: AxiosInstance;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: ParseEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  if (!API_URL) {
    appLogger.error(
      'No API URL present, please check the environment variables'
    );
    return;
  } else {
    // axiosInstance = axios.create({ baseURL: API_URL });
  }

  const parseService = app.get(ParseService);

  try {
    await parseService.processAllFiles(event);
  } catch (err) {
    appLogger.error(err);
  }
};
