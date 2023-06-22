import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { format, parse, subBusinessDays, differenceInDays } from 'date-fns';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { ParseService } from '../parse/parse.service';
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
  const parseService = app.get(ParseService);
  const appLogger = app.get(Logger);

  // Prevent reconciler from running for a program if no valid files today
  // FOR NOW: if the to date range is yesterday and no files have been uploaded today only
  // This is because we still need to be able to reconcile in the past for testing purposes
  const reconciliationDate = new Date(event.period.to);
  if (differenceInDays(reconciliationDate, new Date()) <= 1) {
    // Reconciliation was yesterday, so continue with logic
    const rule = await parseService.getRulesForProgram(event.program);
    if (!rule) {
      throw new Error('No rule for this program');
    }
    const daily = await parseService.getDailyForRule(rule, new Date());
    if (!daily?.success) {
      throw new Error('There are still invalid files for thie date');
    }
  }

  // maxDate is the date we are reconciling until
  // We reconcile 1 business day behind, so the user should only be passing in "yesterday" as maxDate
  // We should also ensure sync (automated - should have all data by 11am PST) and parse have run before this function is called
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
    locations.flatMap((location) => location.merchant_ids.map((id) => id)),
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
      format(subBusinessDays(new Date(dateRange.maxDate), 2), 'yyyy-MM-dd')
    );

    appLogger.log({ exceptions }, PosReconciliationService.name);
  }

  for (const location of locations) {
    const allDates =
      await cashDepositService.findAllCashDepositDatesPerLocation(
        event.program,
        location.pt_location_id
      );

    const filtered = allDates.filter(
      (date: string) =>
        parse(date, 'yyyy-MM-dd', new Date()) >= reconciliationDates.start &&
        parse(date, 'yyyy-MM-dd', new Date()) <= reconciliationDates.end
    );

    //reverse the order - query cash dates is in descending order, we need ascending
    for (const date of filtered.reverse()) {
      const currentCashDepositDate = date;
      const previousCashDepositDate =
        filtered[filtered.indexOf(date) - 2] ??
        format(reconciliationDates.start, 'yyyy-MM-dd');

      const dateRange = {
        minDate: previousCashDepositDate,
        maxDate: currentCashDepositDate,
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
