import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { format, subBusinessDays } from 'date-fns';
import { MatchStatus } from '../common/const';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { PaymentService } from '../transaction/payment.service';
import { AppModule } from '../app.module';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { LocationMethod } from '../location/const';
import { LocationService } from '../location/location.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';

export const handler = async (event: ReconciliationConfigInput) => {
  const disableLogs = process.env.SILENCE_LOGS === 'true';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: disableLogs ? false : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const cashExceptionsService = app.get(CashExceptionsService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(PosReconciliationService);
  const cashDepositService = app.get(CashDepositService);
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const appLogger = app.get(Logger);
  // maxDate is the date we are reconciling until
  // We reconcile 1 business day behind, so the user should only be passing in "yesterday" as maxDate
  const dateRange = { minDate: event.period.from, maxDate: event.period.to };

  const locations =
    event.location_ids.length === 0
      ? await locationService.getLocationsBySource(event.program)
      : await locationService.getLocationsByID(
          event.program,
          event.location_ids,
          LocationMethod.Bank
        );

  const masterLocations = await locationService.getLocationsByID(
    event.program,
    locations.map((location) => location.location_id),
    LocationMethod.POS
  );

  const merchantIds: any = masterLocations.reduce((acc: any, location) => {
    if (acc[location.location_id]) {
      acc[location.location_id].push(location.merchant_id);
    } else {
      acc[location.location_id] = [location.merchant_id];
    }
    return acc;
  }, {});

  // Get all pending pos payments whether its one day or many months
  const allPosPaymentsInDates = await paymentService.findPosPayments(
    dateRange,
    locations,
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  // Get all pending deposits whether its one day or many months
  const allPosDepositsInDates = await posDepositService.findPosDeposits(
    dateRange,
    event.program,
    locations.map((location) => location.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  for (const location of locations) {
    const locationPayments = allPosPaymentsInDates.filter(
      (posPayment) =>
        posPayment.transaction.location_id === location.location_id
    );
    const locationDeposits = allPosDepositsInDates.filter((posDeposit) =>
      merchantIds[location.location_id].includes(posDeposit.merchant_id)
    );

    appLogger.log(
      `Reconciliation POS: ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );
    const reconciled = await posReconciliationService.reconcile(
      location,
      locationPayments,
      locationDeposits
    );

    appLogger.log({ reconciled }, PosReconciliationService.name);

    // Set exceptions for items still PENDING or IN PROGRESS for day before maxDate
    const exceptions = await posReconciliationService.setExceptions(
      location,
      event.program,
      format(subBusinessDays(new Date(dateRange.maxDate), 1), 'yyyy-MM-dd')
    );

    appLogger.log({ exceptions }, PosReconciliationService.name);
  }

  for (const location of locations) {
    // get just dates of deposits in each location
    const cashDates = await cashDepositService.findCashDepositDatesByLocation(
      event.program,
      {
        maxDate: event.period.to,
        minDate: event.period.from,
      },
      location
    );
    for (const [index, date] of cashDates.entries()) {
      const previousCashDepositDate =
        cashDates[index - 2] ??
        format(new Date(event.period.from), 'yyyy-MM-dd');

      const dateRange = {
        minDate: previousCashDepositDate,
        maxDate: date,
      };

      const result = await cashReconciliationService.reconcileCash(
        location,
        event.program,
        dateRange
      );

      appLogger.log({ result });
      const exceptions = await cashExceptionsService.setExceptions(
        location,
        event.program,
        previousCashDepositDate
      );
      appLogger.log({ exceptions }, CashReconciliationService.name);
    }
  }
  const posReport = await reportingService.reportPosMatchSummaryByDate();
  appLogger.log('\n\n=========POS Summary Report: =========\n');
  console.table(posReport);
  const cashReport = await reportingService.reportCashMatchSummaryByDate();
  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  console.table(cashReport);
};
