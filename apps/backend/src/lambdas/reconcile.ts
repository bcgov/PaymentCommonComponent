import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { eachDayOfInterval, format } from 'date-fns';
import { AppModule } from '../app.module';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { LocationService } from '../location/location.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (
  event: ReconciliationConfigInput,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const appLogger = new Logger();

  appLogger.log({ event });
  appLogger.log({ context });

  const locations =
    event.location_ids.length === 0
      ? await locationService.getLocationsBySource(event.program)
      : await locationService.getLocationsByID(
          event.program,
          event.location_ids
        );
  console.log(locations, 'LOCARR');
  await runPosReconciliation(event, locations, appLogger, posRecon);
  await runCashReconciliation(event, locations, appLogger, cashRecon);

  appLogger.log('\n\n=========POS Summary Report: =========\n');
  const posReport = await reportingService.reportPosMatchSummaryByDate();
  console.table(posReport);

  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  const cashReport = await reportingService.reportCashMatchSummaryByDate();
  console.table(cashReport);

  appLogger.log('\n\n=========Reconcile Run Complete=========\n');
};

const runPosReconciliation = async (
  event: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  posRecon: POSReconciliationService
): Promise<void> => {
  const dates = eachDayOfInterval({
    start: new Date(event.period.from),
    end: new Date(event.period.to)
  });

  console.log(dates);

  for (const location of locations) {
    for (const pos_date of dates) {
      appLogger.log(
        `Processing POS Reconciliation for: ${location.description} ${pos_date}`,
        POSReconciliationService.name
      );
      const date = format(pos_date, 'yyyy-MM-dd');
      const posReconciliation = await Promise.all([
        posRecon.reconcile({
          date,
          location,
          program: event.program
        })
      ]);
      appLogger.log(posReconciliation, POSReconciliationService.name);
    }
  }
};

const runCashReconciliation = async (
  { program, period }: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  cashRecon: CashReconciliationService
): Promise<void> => {
  for (const location of locations) {
    const cashDates: string[] =
      await cashRecon.findDistinctDepositDatesByLocation(
        program,
        {
          to_date: period.to,
          from_date: period.from
        },
        location
      );
    console.log(cashDates, 'DATES');
    for (const [dindex, date] of cashDates.entries()) {
      const dateRange = {
        pastDueDate: cashDates[dindex - 2] ?? null,
        from_date: cashDates[dindex - 2] ?? period.from,
        to_date: date
      };
      appLogger.log({ dateRange }, CashReconciliationService.name);

      appLogger.log(
        `Processing CASH Reconciliation for: ${location.description} (${location.location_id})`,
        CashReconciliationService.name
      );
      appLogger.log(
        `PREVIOUS DEPOSIT DATE: ${dateRange.from_date}`,
        CashReconciliationService.name
      );

      appLogger.log(
        `CURRENT DEPOSIT DATE: ${dateRange.to_date}`,
        CashReconciliationService.name
      );

      const cashReconciliation = await cashRecon.reconcileCash(
        location,
        program,
        dateRange
      );
      appLogger.log({ cashReconciliation }, CashReconciliationService.name);

      const pastDueDate = cashDates[dindex - 2] ?? null;
      if (pastDueDate) {
        appLogger.log(
          `Processing CASH Exceptions for: ${location.description} (${location.location_id})`,
          CashReconciliationService.name
        );
        appLogger.log(`CURRENT DATE: ${date}`, CashReconciliationService.name);
        appLogger.log(
          `EXCEPTIONS DATE: ${pastDueDate}`,
          CashReconciliationService.name
        );

        const exceptions = await cashRecon.findExceptions(
          location,
          program,
          pastDueDate
        );

        appLogger.log({ exceptions }, CashReconciliationService.name);
      }
    }
  }
};
