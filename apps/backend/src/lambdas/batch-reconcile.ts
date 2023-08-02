import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { eachDayOfInterval, format, subBusinessDays } from 'date-fns';
import { generateLocalSNSMessage } from './helpers';
import { HandlerEvent } from './interface';
import { handler as reconcile } from './reconcile';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';

import { SnsManagerService } from '../sns-manager/sns-manager.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handler = async (event: HandlerEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const snsService = app.get(SnsManagerService);

  appLogger.log({ event, _context }, 'BATCH RECONCILIATION EVENT');
  const isLocal = process.env.RUNTIME_ENV === 'local';

  const listOfDays = eachDayOfInterval({
    start: event.period.from
      ? new Date(event.period.from)
      : new Date('2023-01-01'),
    end: event.period.to ? new Date(event.period.to) : new Date(),
  });

  const messages = listOfDays.map((date) => ({
    period: {
      from: format(subBusinessDays(date, 31), 'yyyy-MM-dd'),
      to: format(date, 'yyyy-MM-dd'),
    },
    program: event.program,
    generateReport: event.generateReport,
    byPassFileValidity: true,
  }));

  for (const message of messages) {
    if (!isLocal) {
      const topic = process.env.SNS_PARSER_RESULTS_TOPIC;
      await snsService.publish(topic, JSON.stringify(message));
    } else {
      await reconcile(generateLocalSNSMessage(message));
    }
  }
};
