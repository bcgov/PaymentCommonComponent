import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { eachDayOfInterval, format, parse } from 'date-fns';
import { AppModule } from '../app.module';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { LocationService } from '../location/location.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (event: ReconciliationConfigInput) => {
  const disableLogs = process.env.SILENCE_LOGS === 'true';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: disableLogs ? false : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const cashExceptionsService = app.get(CashExceptionsService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(PosReconciliationService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const appLogger = app.get(Logger);

  const locations =
    event.location_ids.length === 0
      ? await locationService.getLocationsBySource(event.program)
      : await locationService.getLocationsByID(
          event.program,
          event.location_ids
        );

  const cashDepositService = app.get(CashDepositService);
  const dates: Date[] = eachDayOfInterval({
    start: parse(event.period.from, 'yyyy-MM-dd', new Date()),
    end: parse(event.period.to, 'yyyy-MM-dd', new Date()),
  });

  for (const location of locations) {
    for (const date of dates) {
      const result = await posReconciliationService.reconcile(
        location,
        event.program,
        date
      );
      appLogger.log({ result }, PosReconciliationService.name);
    }
  }

  for (const location of locations) {
    const cashDates = await cashDepositService.findCashDepositDatesByLocation(
      event.program,
      {
        maxDate: event.period.to,
        minDate: event.period.from,
      },
      location
    );
    for (const [index, date] of cashDates.entries()) {
      const previousCashDepositDate =
        cashDates[index - 2] ??
        format(new Date(event.period.from), 'yyyy-MM-dd');

      const dateRange = {
        minDate: previousCashDepositDate,
        maxDate: date,
      };

      const result = await cashReconciliationService.reconcileCash(
        location,
        event.program,
        dateRange
      );

      appLogger.log({ result });
      const exceptions = await cashExceptionsService.findExceptions(
        location,
        event.program,
        previousCashDepositDate
      );
      appLogger.log({ exceptions }, CashReconciliationService.name);
    }
  }
  const posReport = await reportingService.reportPosMatchSummaryByDate();
  appLogger.log('\n\n=========POS Summary Report: =========\n');
  console.table(posReport);
  const cashReport = await reportingService.reportCashMatchSummaryByDate();
  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  console.table(cashReport);
};
