import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { differenceInDays, format, parse, subBusinessDays } from 'date-fns';
import { FindOptionsOrderValue } from 'typeorm';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { ParseService } from '../parse/parse.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
import { ReportingService } from '../reporting/reporting.service';
import { PaymentService } from '../transaction/payment.service';

export const handler = async (event: ReconciliationConfigInput) => {
  const disableLogs = process.env.SILENCE_LOGS === 'true';
  const maxNumDaysToReconcile = 31;
  const isLocal = process.env.RUNTIME_ENV === 'local';
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
  const currentDate = new Date();
  const numDaysToReconcile = differenceInDays(
    parse(event.period.from, 'yyyy-MM-dd', new Date()),
    parse(event.period.to, 'yyyy-MM-dd', new Date())
  );

  if (numDaysToReconcile > 31 && !isLocal) {
    throw new Error(
      `Invalid date range of ${numDaysToReconcile} days. Maxiumum reconciliation date range is ${maxNumDaysToReconcile}.`
    );
  }

  if (!event.bypass_parse_validity) {
    // Prevent reconciler from running for a program if no valid files today
    const rule = await parseService.getRulesForProgram(event.program);
    if (!rule) {
      throw new Error('No rule for this program');
    }
    const reconciliationDate = new Date();
    const daily = await parseService.getDailyForRule(rule, reconciliationDate);
    if (!daily?.success) {
      throw new Error(
        `Incomplete dataset for this date ${reconciliationDate}. Please check the uploaded files.`
      );
    }
  }

  // maxDate is the date we are reconciling until
  // We reconcile 1 business day behind, so the user should only be passing in "yesterday" as maxDate
  // We should also ensure sync (automated - should have all data by 11am PST) and parse have run before this function is called

  const startDate = subBusinessDays(
    parse(event.period.from, 'yyyy-MM-dd', new Date()),
    1
  );
  const endDate = parse(event.period.to, 'yyyy-MM-dd', new Date());

  const locations: NormalizedLocation[] =
    await locationService.getLocationsBySource(event.program);

  const allPosPaymentsInDates = await paymentService.findPosPayments(
    {
      minDate: format(startDate, 'yyyy-MM-dd'),
      maxDate: format(endDate, 'yyyy-MM-dd'),
    },
    locations.map((itm) => itm.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  // Get all pending deposits whether its one day or many months
  const allPosDepositsInDates = await posDepositService.findPosDeposits(
    {
      minDate: format(startDate, 'yyyy-MM-dd'),
      maxDate: format(endDate, 'yyyy-MM-dd'),
    },
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
    // TODO loop over dates and reconcile each day in order to set the current date for batches....
    const reconciled = await posReconciliationService.reconcile(
      location,
      locationPayments,
      locationDeposits,
      currentDate
    );

    appLogger.log({ reconciled }, PosReconciliationService.name);

    // Set exceptions for items still PENDING or IN PROGRESS for day before maxDate
    const exceptions = await posReconciliationService.setExceptions(
      location,
      event.program,
      format(subBusinessDays(endDate, 2), 'yyyy-MM-dd'),
      currentDate
    );

    appLogger.log({ exceptions }, PosReconciliationService.name);
  }

  const order: FindOptionsOrderValue = 'ASC';

  for (const location of locations) {
    const allCashDepositDatesPerLocation =
      await cashDepositService.findAllCashDepositDatesPerLocation(
        event.program,
        location.pt_location_id,
        order
      );

    const filtered = allCashDepositDatesPerLocation.filter(
      (date: string) =>
        parse(date, 'yyyy-MM-dd', new Date()) >= startDate &&
        parse(date, 'yyyy-MM-dd', new Date()) <= endDate
    );

    for (const date of filtered) {
      const currentCashDepositDate = date;
      const previousCashDepositDate =
        filtered[filtered.indexOf(date) - 2] ?? format(startDate, 'yyyy-MM-dd');

      const dateRange = {
        minDate: previousCashDepositDate,
        maxDate: currentCashDepositDate,
      };

      //TODO replace current cashDepositDate with actual date
      const result = await cashReconciliationService.reconcileCash(
        location,
        event.program,
        dateRange,
        parse(currentCashDepositDate, 'yyyy-MM-dd', new Date())
      );

      appLogger.log({ result });
      //TODO replace current cashDepositDate with actual date
      const exceptions = await cashExceptionsService.setExceptions(
        location,
        event.program,
        previousCashDepositDate,
        parse(currentCashDepositDate, 'yyyy-MM-dd', new Date())
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

  //TODO use this only for local and set the reconciliation lambda destination to trigger the report
  isLocal && (await reportHandler(event));
};
