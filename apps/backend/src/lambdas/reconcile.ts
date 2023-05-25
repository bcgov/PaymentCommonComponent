import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { eachDayOfInterval, format, parse, subBusinessDays } from 'date-fns';
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
import {
  PosDepositsAmountDictionary,
  ReconciliationConfigInput,
} from '../reconciliation/types';
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

  console.time('time');
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

  const allPosPaymentsInDates = await paymentService.findPosPayments(
    { minDate: event.period.from, maxDate: event.period.to },
    locations,
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  const allPosDepositsInDates = await posDepositService.findPosDeposits(
    { minDate: event.period.from, maxDate: event.period.to },
    event.program,
    locations.map((location) => location.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  appLogger.log('FIRST', allPosDepositsInDates.length);

  for (const location of locations) {
    const locationPayments = allPosPaymentsInDates.filter(
      (posPayment) =>
        posPayment.transaction.location_id === location.location_id
    );
    const locationDeposits = allPosDepositsInDates.filter((posDeposit) =>
      merchantIds[location.location_id].includes(posDeposit.merchant_id)
    );
    appLogger.log('LENGTH', locationDeposits.length);

    appLogger.log(
      `Reconciliation POS: ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );
    const reconciled = await posReconciliationService.reconcile(
      location,
      // date range?
      locationPayments,
      locationDeposits
    );

    appLogger.log({ reconciled }, PosReconciliationService.name);

    // heuristic matches
    // update matching payments
    // update rest payments
    // update deposits
  }

  const dates: Date[] = eachDayOfInterval({
    start: parse(event.period.from, 'yyyy-MM-dd', new Date()),
    end: parse(event.period.to, 'yyyy-MM-dd', new Date()),
  });

  // for (const location of locations) {
  //   for (const date of dates) {
  // const minDate = format(subBusinessDays(date, 2), 'yyyy-MM-dd');
  // const maxDate = format(subBusinessDays(date, 1), 'yyyy-MM-dd');
  // const pendingPayments = allPosPaymentsInDates.filter(
  //   (posPayment) =>
  //     posPayment.transaction.transaction_date === minDate ||
  //     posPayment.transaction.transaction_date === maxDate
  // );
  // const pendingDeposits = allPosDepositsInDates.filter(
  //   (posDeposit) =>
  //     posDeposit.transaction_date === minDate ||
  //     posDeposit.transaction_date === maxDate
  // );

  // appLogger.log(
  //   `Reconciliation POS: ${maxDate} - ${location.description} - ${location.location_id}`,
  //   PosReconciliationService.name
  // );
  // const reconciled = await posReconciliationService.reconcile(
  //   location,
  //   // date,
  //   pendingPayments,
  //   pendingDeposits
  // );

  // appLogger.log({ reconciled }, PosReconciliationService.name);

  // const exceptions = await posReconciliationService.findExceptions(
  //   location,
  //   event.program,
  //   date
  // );

  // appLogger.log({ exceptions }, PosReconciliationService.name);
  //   }
  // }

  // for (const location of locations) {
  //   const cashDates = await cashDepositService.findCashDepositDatesByLocation(
  //     event.program,
  //     {
  //       maxDate: event.period.to,
  //       minDate: event.period.from,
  //     },
  //     location
  //   );
  //   for (const [index, date] of cashDates.entries()) {
  //     const previousCashDepositDate =
  //       cashDates[index - 2] ??
  //       format(new Date(event.period.from), 'yyyy-MM-dd');

  //     const dateRange = {
  //       minDate: previousCashDepositDate,
  //       maxDate: date,
  //     };

  //     const result = await cashReconciliationService.reconcileCash(
  //       location,
  //       event.program,
  //       dateRange
  //     );

  //     appLogger.log({ result });
  //     const exceptions = await cashExceptionsService.findExceptions(
  //       location,
  //       event.program,
  //       previousCashDepositDate
  //     );
  //     appLogger.log({ exceptions }, CashReconciliationService.name);
  //   }
  // }
  // const posReport = await reportingService.reportPosMatchSummaryByDate();
  // appLogger.log('\n\n=========POS Summary Report: =========\n');
  // console.table(posReport);
  // const cashReport = await reportingService.reportCashMatchSummaryByDate();
  // appLogger.log('\n\n=========Cash Summary Report: =========\n');
  // console.table(cashReport);
  console.timeEnd('time');
};
