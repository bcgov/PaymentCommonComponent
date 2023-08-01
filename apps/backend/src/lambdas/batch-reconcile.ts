import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { eachDayOfInterval, format, subBusinessDays } from 'date-fns';
import { generateLocalSNSMessage } from './helpers';
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
    appLogger.log(
      {
        message: `Processing Reconciliation For: ${format(date, 'yyyy-MM-dd')}`,
      },
      'BATCH RECONCILIATION EVENT'
    );

    try {
      const reconciliationParams = {
        period: {
          from: format(subBusinessDays(date, 31), 'yyyy-MM-dd'),
          to: format(date, 'yyyy-MM-dd'),
        },
        program: event.program,
        generateReport: event.generateReport,
      };
      if (!isLocal) {
        const topic = process.env.SNS_PARSER_RESULTS_TOPIC;
        await snsService.publish(topic, JSON.stringify(reconciliationParams));
      } else {
        await reconcile(generateLocalSNSMessage(reconciliationParams));
      }
    } catch (err) {
      appLogger.error(err);
      return { success: false, message: `${err}` };
    }
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
