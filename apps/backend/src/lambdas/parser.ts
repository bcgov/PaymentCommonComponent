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

  const eventRouting = event as ParseEvent;
  appLogger.log({ eventRouting });

  if (eventRouting?.Records.length === 0) {
    await parseService.processAllFiles();
    return;
  }

  try {
    await parseService.processEvent(
      event.Records[0].s3.bucket.name,
      event.Records[0].s3.object.key,
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
