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

  appLogger.log(
    `Found ${locations.length} Locations`,
    POSReconciliationService.name
  );
  appLogger.log(
    `Found ${locations.length} Locations`,
    CashReconciliationService.name
  );

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
  event: ReconciliationEventInput,
  locations: LocationEntity[],
  appLogger: AppLogger,
  posRecon: POSReconciliationService
): Promise<void> => {
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
  for (const location of locations) {
    appLogger.log(
      `Processing POS Reconciliation for: ${location.description} `,
      POSReconciliationService.name
    );
    for (const date of dates) {
      appLogger.log(
        `Processing POS Reconciliation for: ${location.description} (${date})`,
        POSReconciliationService.name
      );

      const posReconciliation = await Promise.all([
        posRecon.reconcile({
          date,
          location,
          program: event.program
        })
      ]);

      appLogger.log(posReconciliation, POSReconciliationService.name);
      console.table(posReconciliation);
    }
  }
};

const runCashReconciliation = async (
  event: ReconciliationEventInput,
  locations: LocationEntity[],
  appLogger: AppLogger,
  cashRecon: CashReconciliationService
): Promise<void> => {
  for (const location of locations) {
    appLogger.log(
      `Processing CASH Reconciliation for: ${location.description} (${location.location_id})`,
      CashReconciliationService.name
    );

    const cashDates = await Promise.all(
      await cashRecon.getAllDepositDatesByLocation(
        event.program,
        {
          to_date: event.fiscal_close_date,
          from_date: event.fiscal_start_date
        },
        location
      )
    );
    /* start matching the earliest dates and proceed to the most recent */
    const ascDates = [...cashDates].reverse();

    for (const date of ascDates) {
      appLogger.log(
        `Processing CASH Reconciliation for: ${location.description} (${location.location_id}) - ${event.fiscal_start_date} - ${date}`,
        CashReconciliationService.name
      );

      const cashReconciliation = await Promise.all([
        cashRecon.reconcileCash(location, event.program, date)
      ]);

      appLogger.log(cashReconciliation, CashReconciliationService.name);
      console.table(cashReconciliation);

      const exceptions = await Promise.resolve(
        cashRecon.findExceptions(location, event.program, date)
      );

      appLogger.log(
        `EXCEPTIONS: ${exceptions?.payments.length ?? 0} found for: ${
          location.description
        } (${location.location_id}) on ${date}`,
        CashReconciliationService.name
      );
    }
    console.log(
      `SUMMARY FOR: ${location.description} (${location.location_id})`,
      CashReconciliationService.name
    );
  }
};
