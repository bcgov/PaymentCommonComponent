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

  const posReconciled = await runPosReconciliation(
    event,
    locations,
    appLogger,
    posRecon
  );

  appLogger.log(
    `POS reconciled for ${posReconciled} locations`,
    POSReconciliationService.name
  );
  const cashReconciled = await runCashReconciliation(
    event,
    locations,
    appLogger,
    cashRecon
  );
  appLogger.log(`CASH reconciled for ${cashReconciled} locations`);
  const cashExceptions = await runCashExceptions(
    event,
    locations,
    appLogger,
    cashRecon
  );

  appLogger.log(`CASH exceptions for ${cashExceptions} locations`);

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
  for (const location of locations) {
    const dates: Date[] = eachDayOfInterval({
      start: new Date(event.period.from),
      end: new Date(event.period.to)
    });

    for (const [index, pos_date] of dates.entries()) {
      const date = format(pos_date, 'yyyy-MM-dd');
      appLogger.log(
        `Processing POS Reconciliation for: ${location.description} - ${date}`,
        POSReconciliationService.name
      );

      const posReconciliation = await posRecon.reconcile(
        location,
        event.program,
        format(dates[index], 'yyyy-MM-dd')
      );
      appLogger.log({ posReconciliation }, POSReconciliationService.name);
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
    const cashDates = await cashRecon.findCashDepositDatesByLocation(
      program,
      {
        to_date: period.to,
        from_date: period.from
      },
      location
    );
    for (const [dindex, date] of cashDates.entries()) {
      const dateRange = {
        from_date:
          cashDates[dindex - 2] ?? format(new Date(period.from), 'yyyy-MM-dd'),
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
    }
  }
};

const runCashExceptions = async (
  event: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  cashRecon: CashReconciliationService
): Promise<void> => {
  for (const location of locations) {
    const cashDates: string[] = await cashRecon.findCashDepositDatesByLocation(
      event.program,
      {
        to_date: event.period.to,
        from_date: event.period.from
      },
      location
    );
    for (const [dindex, date] of cashDates.entries()) {
      const pastDueDate = cashDates[dindex - 2] ?? null;
      if (pastDueDate) {
        appLogger.log(
          `Processing CASH EXCEPTIONS for: ${location.description} (${location.location_id})`,
          CashReconciliationService.name
        );
        appLogger.log(
          `EXCEPTIONS DATE: ${cashDates[dindex - 2]}`,
          CashReconciliationService.name
        );

        appLogger.log(
          `CURRENT DEPOSIT DATE: ${date}`,
          CashReconciliationService.name
        );

        const exceptions = await cashRecon.findExceptions(
          location,
          event.program,
          pastDueDate
        );
        appLogger.log({ exceptions }, CashReconciliationService.name);
      }
    }
  }
};
