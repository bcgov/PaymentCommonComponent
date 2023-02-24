import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { Ministries } from '../constants';
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
      console.log(
        '>>>>>> Processing Reconciliation for location_id: ',
        location.location_id,
        location.description
      );

      for (const date of dates) {
        console.log('-------------------------------------------------');
        console.log('Processing POS Reconciliation for date: ', date);
        console.log('-------------------------------------------------');

        console.table(
          await posRecon.reconcile({
            date,
            location,
            program: event.program
          })
        );
      }
    }

    for (const location of locations) {
      console.log('-------------------------------------------------');
      console.log(
        'Processing Cash Reconciliation for date: ',
        event.fiscal_start_date,
        event.fiscal_close_date
      );
      console.log('-------------------------------------------------');
      const cashEvent = {
        fiscal_start_date: event.fiscal_start_date,
        fiscal_close_date: event.fiscal_close_date,
        location,
        program: event.program
      };
      console.table(await cashRecon.reconcile(cashEvent));
    }
  };
  await reconcile(event);

  console.log('\n\n=========Reconcile Run Complete=========\n');

  console.log('\n\n=========Summary Report: =========\n');

  const posSummaryReport = await reportingService.reportPosMatchSummaryByDate();

  console.table(posSummaryReport);

  console.log('\n\n=========Cash Summary Report: =========\n');
  const cashSummaryReport =
    await reportingService.reportCashMatchSummaryByDate();
  console.table(cashSummaryReport);
};
// TODO move this to our makefile
const fiscalStartDate2023 = '2023-01-15';
const reconcileAll: ReconciliationEventInput = {
  fiscal_start_date: fiscalStartDate2023,
  fiscal_close_date: '2023-02-15',
  program: Ministries.SBC,
  location_ids: []
};

handler(reconcileAll);
