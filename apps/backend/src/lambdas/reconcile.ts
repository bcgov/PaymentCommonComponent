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

  const getFiscalDates = (event: ReconciliationEventInput) => {
    const fiscalStart = new Date(event.fiscal_start_date);
    const fiscalEnd = new Date(event.fiscal_close_date);
    const fiscalDates = [];
    while (fiscalStart <= fiscalEnd) {
      fiscalDates.push(new Date(fiscalStart).toDateString());
      fiscalStart.setDate(fiscalStart.getDate() + 1);
    }
    return fiscalDates.map((itm) => itm.toString());
  };

  const reconcile = async (event: ReconciliationEventInput) => {
    const dates = getFiscalDates(event);

    const locations =
      event.location_ids.length === 0
        ? await locationService.getLocationsBySource(event.program)
        : await locationService.getLocationsByID(event);

    for (const location of locations) {
      appLogger.log(
        '>>>>>> Processing Reconciliation for: ',
        location.description
      );

      for (const date of dates) {
        appLogger.log('-------------------------------------------------');
        appLogger.log('Processing POS Reconciliation for date: ', date);
        appLogger.log('-------------------------------------------------');

        console.table(
          await posRecon.reconcile({
            date,
            location,
            program: event.program
          })
        );

        appLogger.log('-------------------------------------------------');
        appLogger.log('Processing CASH Reconciliation for date: ', date);
        appLogger.log('-------------------------------------------------');

        console.table(
          await cashRecon.reconcile({ date, location, program: event.program })
        );
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
