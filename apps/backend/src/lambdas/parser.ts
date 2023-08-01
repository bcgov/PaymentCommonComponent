import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { subBusinessDays } from 'date-fns';
import { AppModule } from '../app.module';
import { Ministries } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';

export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const parseService = app.get(ParseService);
  const snsService = app.get(SnsManagerService);
  const isLocal = process.env.RUNTIME_ENV === 'local';
  appLogger.log({ event, _context }, 'PARSE EVENT');

  try {
    await parseService.processAllFiles(event);
    if (!isLocal) {
      const topic = process.env.SNS_PARSER_RESULTS_TOPIC;
      const response: SNS.Types.PublishResponse = await snsService.publish(
        topic,
        JSON.stringify({
          generateReport: true,
          program: Ministries.SBC,
          period: {
            to: new Date(),
            from: subBusinessDays(new Date(), 31),
          },
        })
      );
      return {
        success: true,
        response,
      };
    }
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
