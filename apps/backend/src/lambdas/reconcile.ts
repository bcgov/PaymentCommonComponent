import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationEventInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (
  event: ReconciliationEventInput,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const appLogger = app.get(AppLogger);

  appLogger.log({ event });
  appLogger.log({ context });

  const locations =
    event.location_ids.length === 0
      ? await locationService.getLocationsBySource(event.program)
      : await locationService.getLocationsByID(
          event.program,
          event.location_ids
        );

  appLogger.log(`=========================================================`);
  appLogger.log(`Found ${locations.length} Locations`);
  appLogger.log(`=========================================================`);

  const reconcile = async (event: ReconciliationEventInput) => {
    for (const location of locations) {
      appLogger.log(`====================================================`);
      appLogger.log(
        `Processing POS Reconciliation for: ${location.description} `
      );
      appLogger.log(`====================================================`);

      await runPosReconciliation(event, location, appLogger, posRecon);

      appLogger.log(`====================================================`);
      appLogger.log(
        `Processing CASH Reconciliation for: ${location.description} (${location.location_id})`
      );
      appLogger.log(`====================================================`);

      await runCashReconciliation(event, location, appLogger, cashRecon);

      console.log(
        `SUMMARY FOR: ${location.description} (${location.location_id})`
      );
      console.table(
        await reportingService.cashReportByLocation(location.location_id)
      );
    }
  };

  await reconcile(event);

  appLogger.log('\n\n=========POS Summary Report: =========\n');
  const posReport = await reportingService.reportPosMatchSummaryByDate();
  console.table(posReport);

  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  const cashReport = await reportingService.reportCashMatchSummaryByDate();
  console.table(cashReport);

  appLogger.log('\n\n=========Reconcile Run Complete=========\n');
};

const runPosReconciliation = async (
  event: ReconciliationEventInput,
  location: LocationEntity,
  appLogger: AppLogger,
  posRecon: POSReconciliationService
) => {
  const getFiscalDatesForPOS = (event: ReconciliationEventInput) => {
    const fiscalStart = new Date(event.fiscal_start_date);
    const fiscalEnd = new Date(event.fiscal_close_date);
    const fiscalDates = [];
    while (fiscalStart < fiscalEnd) {
      fiscalDates.push(new Date(fiscalStart).toDateString());
      fiscalStart.setDate(fiscalStart.getDate() + 1);
    }
    return fiscalDates.map((itm) => itm.toString());
  };

  const dates = getFiscalDatesForPOS(event);

  for (const date of dates) {
    appLogger.log(`=========================================================`);
    appLogger.log(
      `Processing POS Reconciliation for: ${location.description} (${date})`
    );
    appLogger.log(`=========================================================`);
    console.table(
      await posRecon.reconcile({
        date,
        dateRange: {
          to_date: event.fiscal_close_date,
          from_date: event.fiscal_start_date
        },
        location,
        program: event.program
      })
    );
  }
};

const runCashReconciliation = async (
  event: ReconciliationEventInput,
  location: LocationEntity,
  appLogger: AppLogger,
  cashRecon: CashReconciliationService
) => {
  const cashDates = await cashRecon.getDatesForReconciliation(
    event.program,
    {
      to_date: event.fiscal_close_date,
      from_date: event.fiscal_start_date
    },
    location
  );
  appLogger.log(
    `Found  ${[...cashDates].length} Deposit Dates for Location: ${
      location.description
    } (${location.location_id})`
  );

  /* start matching the earliest dates and proceed to the most recent */
  for (const date of cashDates.reverse()) {
    appLogger.log(`=========================================================`);
    appLogger.log(
      `Processing CASH Reconciliation for: ${location.description} (${location.location_id}) - ${date}`
    );
    appLogger.log(`=========================================================`);

    const matches = await cashRecon.reconcileCash({
      location,
      program: event.program,
      dateRange: {
        to_date: event.fiscal_close_date,
        from_date: event.fiscal_start_date
      },
      date
    });

    console.table(matches);

    const exceptions = await cashRecon.findExceptions({
      location,
      program: event.program,
      dateRange: {
        to_date: event.fiscal_close_date,
        from_date: event.fiscal_start_date
      },
      date
    });
    appLogger.log(`=========================================================`);
    appLogger.log(
      `EXCEPTIONS: ${exceptions?.length ?? 0} found for: ${
        location.description
      } (${location.location_id}) on ${date}`
    );
    appLogger.log(`=========================================================`);
  }
};
