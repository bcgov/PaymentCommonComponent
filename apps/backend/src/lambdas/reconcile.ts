import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { eachDayOfInterval, format } from 'date-fns';
import { AppModule } from '../app.module';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { LocationService } from '../location/location.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (
  event: ReconciliationConfigInput,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(POSReconciliationService);
  const cashExceptionsService = app.get(CashExceptionsService);
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

  const posReconciliationRun = await runPosReconciliation(
    event,
    locations,
    appLogger,
    posReconciliationService
  );

  appLogger.log({ posReconciliationRun }, POSReconciliationService.name);

  const cashReconciliationRun = await runCashReconciliation(
    event,
    locations,
    appLogger,
    cashReconciliationService
  );

  appLogger.log({ cashReconciliationRun }, CashReconciliationService.name);

  const cashExceptionsRun = await runCashExceptions(
    event,
    locations,
    appLogger,
    cashReconciliationService,
    cashExceptionsService
  );

  appLogger.log({ cashExceptionsRun }, CashReconciliationService.name);

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
  posReconciliationService: POSReconciliationService
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

      const results = await posReconciliationService.reconcile(
        location,
        event.program,
        format(dates[index], 'yyyy-MM-dd')
      );
      appLogger.log({ results }, POSReconciliationService.name);
    }
  }
};

const runCashReconciliation = async (
  { program, period }: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  cashReconciliationService: CashReconciliationService
): Promise<void> => {
  for (const location of locations) {
    const cashDates =
      await cashReconciliationService.findCashDepositDatesByLocation(
        program,
        {
          to_date: period.to,
          from_date: period.from
        },
        location
      );
    for (const [dindex, date] of cashDates.entries()) {
      const lastDepositDate =
        cashDates[dindex - 2] ?? format(new Date(period.from), 'yyyy-MM-dd');

      const dateRange = {
        from_date: lastDepositDate,
        to_date: date
      };

      appLogger.log({ dateRange }, CashReconciliationService.name);

      appLogger.log(
        `Processing Cash Reconciliation for: ${location.description} (${location.location_id}) for ${dateRange.from_date} - ${dateRange.to_date}`,
        CashReconciliationService.name
      );

      appLogger.log(
        `CURRENT DEPOSIT DATE: ${dateRange.to_date}`,
        CashReconciliationService.name
      );

      const results = await cashReconciliationService.reconcileCash(
        location,
        program,
        dateRange
      );

      appLogger.log({ results }, CashReconciliationService.name);
    }
  }
};

const runCashExceptions = async (
  event: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  cashReconciliationService: CashReconciliationService,
  cashExceptionsService: CashExceptionsService
): Promise<void> => {
  for (const location of locations) {
    const cashDates: string[] =
      await cashReconciliationService.findCashDepositDatesByLocation(
        event.program,
        {
          to_date: event.period.to,
          from_date: event.period.from
        },
        location
      );
    for (const [dindex, date] of cashDates.entries()) {
      const exceptionsDate =
        cashDates[dindex - 2] ?? cashDates[dindex - 1] ?? event.period.from;

      appLogger.log(
        `Processing Cash Exceptions for: ${location.description} (${location.location_id}) for ${exceptionsDate} - ${date}`,
        CashReconciliationService.name
      );

      const exceptions = await cashExceptionsService.findExceptions(
        location,
        event.program,
        exceptionsDate
      );
      appLogger.log({ exceptions }, CashReconciliationService.name);
    }
  }
};
