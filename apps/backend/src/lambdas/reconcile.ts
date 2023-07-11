import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { format, parse, subBusinessDays } from 'date-fns';
import { FindOptionsOrderValue } from 'typeorm';
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
import { UploadsService } from '../uploads/uploads.service';

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
  const uploadService = app.get(UploadsService);
  const appLogger = app.get(Logger);

  if (!event.bypass_parse_validity) {
    // Prevent reconciler from running for a program if no valid files today
    const rule = await uploadService.getUploadRulesForProgram(event.program);
    if (!rule) {
      throw new Error('No rule for this program');
    }
    const reconciliationDate = parse(event.period.to, 'yyyy-MM-dd', new Date());
    const daily = await uploadService.getDailyForRule(rule, reconciliationDate);
    if (!daily?.success) {
      throw new Error(
        `Incomplete dataset for this date ${reconciliationDate}. Please check the uploaded files.`
      );
    }
  }

  // maxDate is the date we are reconciling until
  // We reconcile 1 business day behind, so the user should only be passing in "yesterday" as maxDate
  // We should also ensure sync (automated - should have all data by 11am PST) and parse have run before this function is called

  const reconciliationDates = {
    start: subBusinessDays(
      parse(event.period.from, 'yyyy-MM-dd', new Date()),
      1
    ),
    end: parse(event.period.to, 'yyyy-MM-dd', new Date()),
  };
  const dateRange = {
    minDate: format(reconciliationDates.start, 'yyyy-MM-dd'),
    maxDate: format(reconciliationDates.end, 'yyyy-MM-dd'),
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
      locationDeposits,
      parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
    );

    appLogger.log({ reconciled }, PosReconciliationService.name);

    // Set exceptions for items still PENDING or IN PROGRESS for day before maxDate
    const exceptions = await posReconciliationService.setExceptions(
      location,
      event.program,
      format(
        subBusinessDays(parse(dateRange.maxDate, 'yyyy-MM-dd', new Date()), 2),
        'yyyy-MM-dd'
      ),
      parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
    );

    appLogger.log({ exceptions }, PosReconciliationService.name);
  }

  const order: FindOptionsOrderValue = 'ASC';

  for (const location of locations) {
    const allDates =
      await cashDepositService.findAllCashDepositDatesPerLocation(
        event.program,
        location.pt_location_id,
        order
      );

    const filtered = allDates.filter(
      (date: string) =>
        parse(date, 'yyyy-MM-dd', new Date()) >= reconciliationDates.start &&
        parse(date, 'yyyy-MM-dd', new Date()) <= reconciliationDates.end
    );

    for (const date of filtered) {
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
        previousCashDepositDate,
        currentCashDepositDate
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
