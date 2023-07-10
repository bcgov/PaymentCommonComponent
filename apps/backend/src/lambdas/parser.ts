import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { ParseEvent } from './interface';
import * as appModule from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';

// let axiosInstance: AxiosInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: ParseEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(appModule.AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);

  appLogger.log('Parsing Lambda Handler', { event });
  appLogger.log('Parsing Lambda Handler', { _context });
  const splitKey = event.Key.split('/');
  const bucket = splitKey[0];
  const program = splitKey[1];
  const filename = splitKey[2];

  try {
    await parseService.processEvent(
      bucket,
      `${program}/${filename}`,
      event.EventName
    );

    // await reconcile({
    //   period: {
    //     from: '2023-01-01',
    //     to: format(new Date(), 'yyyy-MM-dd'),
    //   },
    //   location_ids: [],
    //   program: Ministries.SBC,
    //   bypass_parse_validity: true,
    // });
  } catch (err) {
    appLogger.error(err);
  }
};
