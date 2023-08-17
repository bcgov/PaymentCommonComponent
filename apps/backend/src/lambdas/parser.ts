import { NestFactory } from '@nestjs/core';
import { S3Event, Context } from 'aws-lambda';
import { format } from 'date-fns';
import { ReconciliationEventMessage } from './interface';
import { AppModule } from '../app.module';
import { Ministries } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { ParseService } from '../parse/parse.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';

export const handler = async (event: S3Event, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = new AppLogger();
  appLogger.setContext('Parser Lambda');
  const parseService = app.get(ParseService);
  const snsService = app.get(SnsManagerService);

  const automationDisabled = process.env.DISABLE_AUTOMATED_RECONCILIATION;

  const isLocal: boolean = process.env.RUNTIME_ENV === 'local';
  appLogger.log({ event, _context });
  const triggerReconcileSnsMessage = async () => {
    const message: ReconciliationEventMessage = {
      program: Ministries.SBC,
      reportEnabled: true,
      byPassFileValidity: false,
      reconciliationMaxDate: format(new Date(), 'yyyy-MM-dd'),
    };

    if (!isLocal && !automationDisabled) {
      appLogger.log('Publishing SNS to reconcile');
      const topic = process.env.SNS_PARSER_RESULTS_TOPIC;
      await snsService.publish(topic, JSON.stringify(message));
    }
  };

  try {
    await parseService.processAllFiles(event);
    await triggerReconcileSnsMessage();
  } catch (err) {
    appLogger.error(err);
    return { success: false, message: `${err}` };
  }
};
