import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { format, parse, subBusinessDays } from 'date-fns';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';
import { PaymentService } from '../transaction/payment.service';

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

  const reconciliationDates = {
    start: parse(event.period.from, 'yyyy-MM-dd', new Date()),
    end: parse(event.period.to, 'yyyy-MM-dd', new Date()),
  };

  const allLocations: NormalizedLocation[] =
    await locationService.getLocationsBySource(event.program);

  const locations =
    event.location_ids.length === 0
      ? allLocations
      : allLocations.filter((location) =>
          event.location_ids.find(
            (event_location_id) => event_location_id === location.location_id
          )
        );

  const allPosPaymentsInDates = await paymentService.findPosPayments(
    dateRange,
    locations.map((itm) => itm.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  // Get all pending deposits whether its one day or many months
  const allPosDepositsInDates = await posDepositService.findPosDeposits(
    dateRange,
    event.program,
    locations.flatMap((location) => location.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  for (const location of locations) {
    const locationPayments = allPosPaymentsInDates.filter(
      (posPayment) =>
        posPayment.transaction.location_id === location.location_id
    );

    const locationDeposits = allPosDepositsInDates.filter((posDeposit) =>
      location.merchant_ids.includes(posDeposit.merchant_id)
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
        maxDate: format(reconciliationDates.end, 'yyyy-MM-dd'),
        minDate: format(reconciliationDates.start, 'yyyy-MM-dd'),
      },
      location.pt_location_id
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
  const statusReport = await reportingService.getStatusReport();
  appLogger.log('\n\n=========POS Summary Report: =========\n');
  console.table(posReport);
  const { paymentStatus, depositStatus } = statusReport;
  console.table(paymentStatus);
  console.table(depositStatus);
  const cashReport = await reportingService.reportCashMatchSummaryByDate();
  appLogger.log('\n\n=========Cash Summary Report: =========\n');
  console.table(cashReport);
};
