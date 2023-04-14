import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { format, parse } from 'date-fns';
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
  const getFiscalDatesForPOS = (event: ReconciliationConfigInput) => {
    const fiscalStart = new Date(event.period.from);
    const fiscalEnd = new Date(event.period.to);
    const fiscalDates = [];
    while (fiscalStart < fiscalEnd) {
      fiscalDates.push(new Date(fiscalStart).toDateString());
      fiscalStart.setDate(fiscalStart.getDate() + 1);
    }
    return fiscalDates.map((itm) => new Date(itm));
  };

  const dates = getFiscalDatesForPOS(event);
  for (const location of locations) {
    for (const date of dates) {
      appLogger.log(
        `Processing POS Reconciliation for: ${location.description} (${format(
          date,
          'yyyy-MM-dd'
        )})`,
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
  { program, period }: ReconciliationConfigInput,
  locations: LocationEntity[],
  appLogger: Logger,
  cashRecon: CashReconciliationService
): Promise<void> => {
  for (const location of locations) {
    const cashDates: Date[] =
      await cashRecon.findDistinctDepositDatesByLocation(
        program,
        {
          to_date: parse(period.to, 'yyyy-MM-dd', new Date()),
          from_date: parse(period.from, 'yyyy-MM-dd', new Date())
        },
        location
      );

    for (const [dindex, date] of cashDates.entries()) {
      const dateRange = {
        from_date: cashDates[dindex - 2] ?? null,
        to_date: date
      };

      if (dateRange.from_date) {
        appLogger.log(
          `Processing CASH Reconciliation for: ${location.description} (${location.location_id})`,
          CashReconciliationService.name
        );
        appLogger.log(
          `PREVIOUS DEPOSIT DATE: ${format(dateRange.from_date, 'yyyy-MM-dd')}`,
          CashReconciliationService.name
        );

        appLogger.log(
          `CURRENT DEPOSIT DATE: ${format(dateRange.to_date, 'yyyy-MM-dd')}`,
          CashReconciliationService.name
        );

        const cashReconciliation = await Promise.all([
          cashRecon.reconcileCash(location, program, dateRange)
        ]);
        appLogger.log({ cashReconciliation }, CashReconciliationService.name);
      }
      const pastDueDate = cashDates[dindex - 2] ?? null;
      if (pastDueDate) {
        appLogger.log(
          `Processing CASH Exceptions for: ${location.description} (${location.location_id})`,
          CashReconciliationService.name
        );
        appLogger.log(
          `CURRENT DATE: ${format(date, 'yyyy-MM-dd')}`,
          CashReconciliationService.name
        );
        appLogger.log(
          `EXCEPTIONS DATE: ${format(pastDueDate, 'yyyy-MM-dd')}`,
          CashReconciliationService.name
        );

        const exceptions = await Promise.all([
          cashRecon.findExceptions(location, program, pastDueDate)
        ]);
        console.table(exceptions);
        appLogger.log({ exceptions }, CashReconciliationService.name);
      }
    }
  }
};
