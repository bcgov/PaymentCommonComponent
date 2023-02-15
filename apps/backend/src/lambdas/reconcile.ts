import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import * as Console from 'console';
import { AppModule } from '../app.module';
import { Ministries } from '../constants';
import { AppLogger } from '../logger/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { ReconciliationEventInput } from '../reconciliation/const';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReportingService } from '../reporting/reporting.service';
import { LocationService } from './../location/location.service';

const consoleTable = Console.table;

export const handler = async (
  event: ReconciliationEventInput,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const locationService = app.get(LocationService);
  const appLogger = app.get(AppLogger);
  const reportingService = app.get(ReportingService);

  appLogger.log({ event });
  appLogger.log({ context });

  const getFiscalDates = (event: ReconciliationEventInput) => {
    const fiscalStart = new Date(event.fiscal_start_date);
    const fiscalEnd = new Date(event.fiscal_end_date);
    const fiscalDates = [];
    while (fiscalStart <= fiscalEnd) {
      fiscalDates.push(new Date(fiscalStart).toDateString());
      fiscalStart.setDate(fiscalStart.getDate() + 1);
    }
    return fiscalDates.map((itm) => itm.toString());
  };

  const reconcile = async (event: ReconciliationEventInput) => {
    const dates = getFiscalDates(event);

    // TODO: simply this later on..
    if (event.program === 'SBC' && event.location_ids.length === 0) {
      const locations = await locationService.getLocationsBySource(
        Ministries.SBC
      );
      locations.map(({ location_id }) =>
        event?.location_ids?.push(location_id)
      );
    }
    console.log(`\n-------------------------------------------------\n`);
    appLogger.log(`Processing Reconciliation for fiscal date range ${event.fiscal_start_date} 
      to ${event.fiscal_end_date}\n
      Total Locations Found for SBC:  ${event.location_ids.length}`);
    console.log(`\n-------------------------------------------------\n`);

    for (const date of dates) {
      console.log(`\n-------------------------------------------------\n`);
      appLogger.log(`Processing Reconciliation for date:  ${date}`);
      console.log(`\n-------------------------------------------------\n`);
      for (const location_id of event.location_ids) {
        console.log(`\n-------------------------------------------------\n`);
        appLogger.log(
          `Processing Reconciliation for location_id: ${location_id}`
        );
        console.log(`\n-------------------------------------------------\n`);

        const posReconciliation = await posRecon.reconcile({
          date,
          location_id,
          program: event.program
        });

        appLogger.log(posReconciliation);

        await cashRecon.reconcile({
          date,
          location_id,
          program: event.program
        });
      }
    }
  };

  await reconcile(event);

  console.log('\n=========Reconcile Run Complete=========\n');
  console.log('\n=========Summary Report: =========\n');

  const posSummaryReport = await reportingService.reportPosMatchSummaryByDate();
  const cashSummaryReport =
    await reportingService.reportCashMatchSummaryByDate();
  consoleTable(posSummaryReport);
  consoleTable(cashSummaryReport);
  return {
    message: 'Reconciliation complete'
  };
};

const reconcileAll: ReconciliationEventInput = {
  fiscal_start_date: '2023-02-01',
  fiscal_end_date: '2023-02-02',
  program: 'SBC',
  location_ids: [31, 61]
};

handler(reconcileAll);
