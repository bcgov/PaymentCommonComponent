import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { eachDayOfInterval, format } from 'date-fns';
import { generateLocalSNSMessage } from './helpers';
import { BatchHandlerEvent, ReconciliationEventMessage } from './interface';
import { handler as reconcile } from './reconcile';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';

import { SnsManagerService } from '../sns-manager/sns-manager.service';
/**
 * Enables batch reconciliation by iterating over the dates for a given period.
 * Use batch.json to configure locally.
 * Not used in production.
 * @param event
 * @param _context
 */
export const handler = async (event: BatchHandlerEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  appLogger.setContext('Batch Reconcile Lambda');

  const snsService = app.get(SnsManagerService);

  appLogger.log({ event, _context }, 'BATCH RECONCILIATION EVENT');
  const isLocal = process.env.RUNTIME_ENV === 'local';

  const listOfDays = eachDayOfInterval({
    start: event.period.from
      ? new Date(event.period.from)
      : new Date('2023-01-01'),
    end: event.period.to ? new Date(event.period.to) : new Date(),
  });

  const messages: ReconciliationEventMessage[] = listOfDays.map((date) => ({
    reconciliationMaxDate: format(date, 'yyyy-MM-dd'),
    program: event.program,
    reportEnabled: event.reportEnabled,
    byPassFileValidity: event.byPassFileValidity,
  }));

  for (const message of messages) {
    if (!isLocal) {
      const topic = process.env.SNS_TRIGGER_RECONCILIATION_TOPIC_ARN;
      await snsService.publish(topic, JSON.stringify(message));
    } else {
      await reconcile(generateLocalSNSMessage(message));
    }
  }
};
