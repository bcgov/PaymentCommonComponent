import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import {
  eachDayOfInterval,
  format,
  isSaturday,
  isSunday,
  subBusinessDays,
} from 'date-fns';
import { HandlerEvent } from './interface';
import { handler as reconcile } from './reconcile';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';
import { ReportingService } from '../reporting/reporting.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const handler = async (event: HandlerEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const snsService = app.get(SnsManagerService);
  const isLocal = process.env.RUNTIME_ENV === 'local';
  const reportingService = app.get(ReportingService);

  const listOfDays = eachDayOfInterval({
    start: event.period.from
      ? new Date(event.period.from)
      : new Date('2023-01-01'),
    end: event.period.to ? new Date(event.period.to) : new Date(),
  });

  appLogger.log({ event, _context }, 'BATCH RECONCILIATION EVENT');

  for (const date of listOfDays) {
    if (!isSaturday(date) && !isSunday(date)) {
      appLogger.log(
        {
          message: `Processing Reconciliation For: ${format(
            date,
            'yyyy-MM-dd'
          )}`,
        },
        'BATCH RECONCILIATION EVENT'
      );

      try {
        const reconciliationInputs = {
          period: {
            from: format(subBusinessDays(date, 31), 'yyyy-MM-dd'),
            to: format(date, 'yyyy-MM-dd'),
          },
          program: event.program,
          generateReport: event.generateReport,
        };
        if (!isLocal) {
          const SNS_PARSER_RESULTS_TOPIC = process.env.SNS_PARSER_RESULTS_TOPIC;
          const response: SNS.Types.PublishResponse = await snsService.publish(
            SNS_PARSER_RESULTS_TOPIC || '',
            JSON.stringify(reconciliationInputs)
          );
          return {
            success: true,
            response,
          };
        } else {
          await reconcile({
            Records: [
              {
                EventSource: 'aws:sns',
                EventVersion: '1.0',
                EventSubscriptionArn: 'arn:aws:sns:EXAMPLE',
                Sns: {
                  SignatureVersion: '1',
                  Timestamp: '1970-01-01T00:00:00.000Z',
                  Signature: 'EXAMPLE',
                  SigningCertUrl: 'EXAMPLE',
                  MessageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
                  TopicArn: 'arn:aws:sns:us-east-2:123456789012:MyTopic',
                  MessageAttributes: {},
                  Type: 'Notification',
                  UnsubscribeUrl: 'EXAMPLE',
                  Subject: 'TestInvoke',
                  Message: JSON.stringify(reconciliationInputs),
                },
              },
            ],
          });
        }
      } catch (err) {
        appLogger.error(err);
        return { success: false, message: `${err}` };
      }
    }
    appLogger.log(
      {
        message: `Skipping Reconciliation: ${format(
          date,
          'yyyy-MM-dd'
        )} because it is a weekend.`,
      },
      { context: 'RECONCILIATION EVENT' }
    );
  }
  const showConsoleReport = async () => {
    const posReport = await reportingService.reportPosMatchSummaryByDate();
    const statusReport = await reportingService.getStatusReport();
    appLogger.log('\n\n=========POS Summary Report: =========\n');
    console.table(posReport);
    const { paymentStatus, depositStatus } = statusReport;
    console.table(paymentStatus);
    console.table(depositStatus);
    const cashReport = await reportingService.reportCashMatchSummaryByDate();
    appLogger.log('\n\n=========Cash Summary Report: =========\n');
    console.table(cashReport);
  };
  isLocal && (await showConsoleReport());
};
