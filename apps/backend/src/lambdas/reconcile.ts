import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
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

  const locations =
    event.location_ids.length === 0
      ? await locationService.getLocationsBySource(event.program)
      : await locationService.getLocationsByID(event);
  appLogger.log(`Found ${locations.length} pos_deposit locations`);

  const reconcile = async (event: ReconciliationEventInput) => {
    const dates = getFiscalDatesForPOS(event);

    for (const location of locations) {
      for (const date of dates) {
        appLogger.log('-------------------------------------------------');
        appLogger.log(
          `Processing POS Reconciliation for: ${location.description} ${date}`
        );
        appLogger.log('-------------------------------------------------');
        console.table(
          await posRecon.reconcile({
            date,
            location,
            program: event.program
          })
        );
      }
      const cashDates = await cashRecon.getDatesForReconciliation({
        ...event,
        location
      });
      appLogger.log(
        `Found Deposits on: ${[...cashDates]} for location: ${
          location.description
        }`
      );
      /* start matching the earliest dates and proceed to the most recent */
      for (const date of cashDates.reverse()) {
        appLogger.log('-------------------------------------------------');
        appLogger.log(
          `Processing CASH Reconciliation for: ${location.description} ${date}`
        );
        appLogger.log('-------------------------------------------------');

        const matched = await cashRecon.reconcileCash({
          ...event,
          date,
          location
        });
        console.log(`SUMMARY FOR: ${location.description}`);
        console.table(
          await reportingService.cashReportByLocation(location.location_id)
        );
        console.table(matched);
        appLogger.log('-------------------------------------------------');
        appLogger.log(
          `Processing finding CASH Exceptions for: ${location.description} ${date}`
        );
        appLogger.log('-------------------------------------------------');
        const exceptions = await cashRecon.findExceptions({
          ...event,
          date,
          location
        });
        appLogger.log('-------------------------------------------------');
        appLogger.log(
          `EXCEPTIONS: ${exceptions?.length ?? 0} found for: ${
            location.description
          } ${date}`
        );
        appLogger.log('-------------------------------------------------');
      }
    }
  };

  await reconcile(event);

  appLogger.log('\n\n=========Reconcile Run Complete=========\n');

  appLogger.log('\n\n=========Summary Report: =========\n');

  const posSummaryReport = await reportingService.reportPosMatchSummaryByDate();

  console.table(posSummaryReport);

  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  const cashSummaryReport =
    await reportingService.reportCashMatchSummaryByDate();
  console.table(cashSummaryReport);
};
