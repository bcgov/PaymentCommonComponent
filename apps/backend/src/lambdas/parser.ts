import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';

const API_URL = process.env.API_URL;
// let axiosInstance: AxiosInstance;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  appLogger.log({ event, _context }, 'PARSE EVENT');

  if (!API_URL) {
    appLogger.error(
      'No API URL present, please check the environment variables'
    );
    return;
  } else {
    // axiosInstance = axios.create({ baseURL: API_URL });
  }

  try {
    await parseService.processAllFiles(event);
    return {
      success: true,
      response: event,
    };
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
