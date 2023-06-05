import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import {
  format,
  getMonth,
  getYear,
  isSaturday,
  isSunday,
  parse,
} from 'date-fns';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { DateRange, NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { ReportConfig } from '../reporting/interfaces';
import { ReportingService } from '../reporting/reporting.service';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from '../transaction/payment.service';

export const handler = async (event: ReportConfig, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  if (
    isSaturday(parse(event.period.to, 'yyyy-MM-dd', new Date())) ||
    isSunday(parse(event.period.to, 'yyyy-MM-dd', new Date()))
  ) {
    appLogger.log(
      `Skipping Reconciliation Report generation for ${event.period.to} as it is a weekend`,
      ReportingService.name
    );
    return;
  }
  const reportingService = app.get(ReportingService);
  const locationService = app.get(LocationService);
  const locations = await locationService.getLocationsBySource(event.program);

  const { posDeposits, posPayments } = await posReportData(
    app,
    event,
    locations
  );
  const { cashDeposits, cashPayments } = await cashReportData(
    app,
    event,
    locations
  );

  const { casDeposits, casDates } = await casReportData(app, event, locations);

  appLogger.log({ context });
  appLogger.log({ event });
  await reportingService.generateReport(
    event,
    locations,
    posDeposits,
    posPayments,
    cashDeposits,
    cashPayments,
    casDeposits,
    casDates
  );
};

const cashReportData = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
) => {
  const paymentService = app.get(PaymentService);
  const cashDepositService = app.get(CashDepositService);
  const pendingAndInProgressPayments = await paymentService.findCashPayments(
    { minDate: event.period.from, maxDate: event.period.to },
    locations.map((l) => l.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );
  const pendingAndInProgressDeposits =
    await cashDepositService.findCashDepositsForReport(
      locations.map((l) => l.pt_location_id),
      event.program,
      { minDate: event.period.from, maxDate: event.period.to },
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

  const currentCashDeposits =
    await cashDepositService.findCashDepositsForReport(
      locations.map((l) => l.pt_location_id),
      event.program,
      { minDate: event.period.to, maxDate: event.period.to },
      [MatchStatus.MATCH, MatchStatus.EXCEPTION]
    );

  const currentCashPayments: {
    payments: PaymentEntity[];
    dateRange: DateRange;
  }[] = [];
  if (currentCashDeposits.length > 0) {
    for (const l of locations) {
      const cashDepositDatesForLocations =
        await cashDepositService.findCashDepositDatesByLocation(
          event.program,
          { minDate: event.period.from, maxDate: event.period.to },
          l.pt_location_id
        );
      const cashDates = {
        maxDate: event.period.to,
        minDate:
          cashDepositDatesForLocations[
            cashDepositDatesForLocations.indexOf(event.period.to) - 1
          ],
      };
      console.log(cashDates);
      if (cashDates.minDate) {
        const paymentsMatchedOrException =
          await paymentService.findCashPayments(
            cashDates,
            [l.location_id],
            [MatchStatus.MATCH, MatchStatus.EXCEPTION]
          );
        currentCashPayments.push({
          payments: paymentsMatchedOrException,
          dateRange: cashDates,
        });
      }
    }
  }
  return {
    cashDeposits: {
      pending: pendingAndInProgressDeposits,
      current: currentCashDeposits,
    },
    cashPayments: {
      pending: pendingAndInProgressPayments,
      current: currentCashPayments,
    },
  };
};

const posReportData = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
) => {
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);

  const pendingAndInProgressPayments = await paymentService.findPosPayments(
    { minDate: event.period.from, maxDate: event.period.to },
    locations.map((itm) => itm.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  const matchedPaymentsAndExceptions = await paymentService.findPosPayments(
    { minDate: event.period.to, maxDate: event.period.to },
    locations.map((itm) => itm.location_id),
    [MatchStatus.MATCH, MatchStatus.EXCEPTION]
  );

  const matchedPayments = matchedPaymentsAndExceptions.filter(
    (itm: PaymentEntity) => itm.status === MatchStatus.MATCH
  );

  const paymentExceptions = matchedPaymentsAndExceptions.filter(
    (itm: PaymentEntity) => itm.status === MatchStatus.EXCEPTION
  );

  const pendingAndInProgressDeposits = await posDepositService.findPosDeposits(
    { minDate: event.period.from, maxDate: event.period.to },
    event.program,
    locations.flatMap((itm: NormalizedLocation) => itm.merchant_ids),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );
  console.log(pendingAndInProgressDeposits, 'PENDING AND IN PROGRESS');
  const matchedDepositsAndExceptions = await posDepositService.findPosDeposits(
    { minDate: event.period.to, maxDate: event.period.to },
    event.program,
    locations.flatMap((itm: NormalizedLocation) => itm.merchant_ids),
    [MatchStatus.MATCH, MatchStatus.EXCEPTION]
  );
  const matchedDeposits = matchedDepositsAndExceptions.filter(
    (itm: POSDepositEntity) => itm.status === MatchStatus.MATCH
  );
  const depositExceptions = matchedDepositsAndExceptions.filter(
    (itm: POSDepositEntity) => itm.status === MatchStatus.EXCEPTION
  );
  const matchedDepositIdsFromPayments =
    matchedPayments.map((itm: PaymentEntity) => itm.pos_deposit_match) ?? [];
  /*eslint-disable */
  const matchedDepositsFromAnotherDay: POSDepositEntity[] = [];

  matchedDepositIdsFromPayments.forEach((itm: POSDepositEntity | undefined) => {
    if (itm) {
      if (
        !matchedDeposits.find((deposit: POSDepositEntity) => deposit === itm)
      ) {
        matchedDepositsFromAnotherDay.push(itm);
      }
    }
  });
  const depositsWithoutMatchedPayment = matchedDeposits.filter(
    (itm: POSDepositEntity) =>
      matchedPayments.find(
        (pymnt: PaymentEntity) => pymnt.pos_deposit_match === itm
      )
  );
  const matchedPaymentsFromAnotherDay =
    await paymentService.findPaymentsByPosDeposits(
      depositsWithoutMatchedPayment
    );
  const posPaymentsForReport = [
    ...pendingAndInProgressPayments,
    ...matchedPayments,
    ...matchedPaymentsFromAnotherDay,
    ...paymentExceptions,
  ];
  const posDepositsFroReport = [
    ...pendingAndInProgressDeposits,
    ...matchedDeposits,
    ...matchedDepositsFromAnotherDay,
    ...depositExceptions,
  ];

  return {
    posPayments: posPaymentsForReport,
    posDeposits: posDepositsFroReport,
  };
};

const casReportData = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
) => {
  const cashDepositService = app.get(CashDepositService);
  const posDepositService = app.get(PosDepositService);
  const maxDate = parse(event.period.to, 'yyyy-MM-dd', new Date());
  /* extract the month from the "to-date"*/
  const minDate = new Date(getYear(maxDate), getMonth(maxDate), 1);

  const dateRange = {
    minDate: format(minDate, 'yyyy-MM-dd'),
    maxDate: format(maxDate, 'yyyy-MM-dd'),
  };

  const cashDepositsResults: CashDepositEntity[] =
    await cashDepositService.findCashDepositsForReport(
      locations.map((itm) => itm.pt_location_id),
      event.program,
      dateRange
    );

  const posDeposits: POSDepositEntity[] =
    await posDepositService.findPOSBySettlementDate(
      locations,
      event.program,
      dateRange
    );

  return {
    casDeposits: { cash: cashDepositsResults, pos: posDeposits },
    casDates: dateRange,
  };
};
