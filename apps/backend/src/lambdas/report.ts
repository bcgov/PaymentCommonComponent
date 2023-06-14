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
  subBusinessDays,
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
import { PosHeuristicRound } from '../reconciliation/types';
import { ReportConfig } from '../reporting/interfaces';
import { ReportingService } from '../reporting/reporting.service';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from '../transaction/payment.service';
/**
 * Report lambda handler for reconciliation report
 * Report input "to date" should be 3 business days prior to the report date and reconciliation should run the previous day
 * @param event
 * @param context
 * @returns
 */
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

  const { posDeposits, posPayments } = await getPosReportData(
    app,
    event,
    locations
  );
  const { cashDeposits, cashPayments } = await getCashReportData(
    app,
    event,
    locations
  );

  const { pageThreeDeposits, pageThreeDepositDates } =
    await getPageThreeDeposits(app, event, locations);

  appLogger.log({ context });
  appLogger.log({ event });
  await reportingService.generateReport(
    event,
    locations,
    { posDeposits, cashDeposits },
    { posPayments, cashPayments },
    pageThreeDeposits,
    pageThreeDepositDates
  );
};
/**
 * Query for all matched/exceptions deposits and payments from report date, as well as the cash matching deposit window
 * Query for all pending/in_progress deposits and payments from report date-range
 * @param app
 * @param event
 * @param locations
 * @returns
 */
const getCashReportData = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
): Promise<{
  cashDeposits: CashDepositEntity[];
  cashPayments: PaymentEntity[];
}> => {
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

  const matchedCashDeposits =
    await cashDepositService.findCashDepositsForReport(
      locations.map((l) => l.pt_location_id),
      event.program,
      { minDate: event.period.from, maxDate: event.period.to },
      [MatchStatus.MATCH]
    );

  const matchedCashPayments =
    await paymentService.findCashPaymentsByDepositMatch(matchedCashDeposits);

  const cashExceptions: {
    payments: PaymentEntity[];
    deposits: CashDepositEntity[];
  } = { payments: [], deposits: [] };

  //TO DO query all at once and create a dictionary of the dates per location
  for (const location of locations) {
    // Get all of the deposit dates for a location
    const allDates =
      await cashDepositService.findAllCashDepositDatesPerLocation(
        event.program,
        location.pt_location_id
      );
    // filter out dates that are not in the report period
    const filtered = allDates.filter(
      (date: string) =>
        parse(date, 'yyyy-MM-dd', new Date()) >=
          parse(event.period.from, 'yyyy-MM-dd', new Date()) &&
        parse(date, 'yyyy-MM-dd', new Date()) <=
          parse(event.period.to, 'yyyy-MM-dd', new Date())
    );

    // set variable for most recent deposit date
    const current = filtered[0] ?? event.period.to;

    // set variable for first (earliest) deposit date in report period
    const prev = filtered[filtered.length - 1] ?? event.period.from;
    // use current deposit date as maxDate for payments
    const paymentQueryMaxDate = current;
    // use the deposit date BEFORE the earliest deposit date in the report period
    const paymentQueryMinDate =
      allDates[allDates.indexOf(prev) + 2] ??
      allDates[allDates.indexOf(prev) + 1] ??
      allDates[allDates.indexOf(prev)];

    // query for all payments between the earliest cash deposit BEFORE the report config min and the current deposit date
    const paymentExceptions = await paymentService.findCashPayments(
      {
        minDate: paymentQueryMinDate,
        maxDate: paymentQueryMaxDate,
      },
      [location.location_id],
      [MatchStatus.EXCEPTION]
    );

    const depositExceptions =
      await cashDepositService.findCashDepositsForReport(
        [location.pt_location_id],
        event.program,
        {
          minDate: event.period.from,
          maxDate: event.period.to,
        },
        [MatchStatus.EXCEPTION]
      );
    cashExceptions.payments.push(...paymentExceptions);
    cashExceptions.deposits.push(...depositExceptions);
  }

  return {
    cashDeposits: [
      ...pendingAndInProgressDeposits,
      ...matchedCashDeposits,
      ...cashExceptions.deposits,
    ],
    cashPayments: [
      ...pendingAndInProgressPayments,
      ...matchedCashPayments,
      ...cashExceptions.payments,
    ],
  };
};
/**
 * Query for all matched/exceptions deposits and payments from report date, as well deposits from a different date matched on round 3
 * Query for all pending/in_progress deposits and payments from report date-range
 * @param app
 * @param event
 * @param locations
 * @returns
 */
const getPosReportData = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
): Promise<{
  posPayments: PaymentEntity[];
  posDeposits: POSDepositEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);
  const payment_matches = true;
  const pos_deposit_matches = true;
  const pendingAndInProgressPayments = await paymentService.findPosPayments(
    { minDate: event.period.from, maxDate: event.period.to },
    locations.map((itm) => itm.location_id),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  const matchedPayments = await paymentService.findPosPayments(
    { minDate: event.period.from, maxDate: event.period.to },
    locations.map((itm) => itm.location_id),
    [MatchStatus.MATCH],
    pos_deposit_matches
  );

  const paymentExceptions = await paymentService.findPosPayments(
    {
      minDate:
        event.period.from === event.period.to
          ? format(
              subBusinessDays(
                parse(event.period.to, 'yyyy-MM-dd', new Date()),
                1
              ),
              'yyyy-MM-dd'
            )
          : format(
              subBusinessDays(
                parse(event.period.from, 'yyyy-MM-dd', new Date()),
                1
              ),
              'yyyy-MM-dd'
            ),
      maxDate: event.period.to,
    },
    locations.map((itm) => itm.location_id),
    [MatchStatus.EXCEPTION]
  );

  const pendingAndInProgressDeposits = await posDepositService.findPosDeposits(
    { minDate: event.period.from, maxDate: event.period.to },
    event.program,
    locations.flatMap((itm: NormalizedLocation) => itm.merchant_ids),
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  const matchedDeposits = await posDepositService.findPosDeposits(
    { minDate: event.period.from, maxDate: event.period.to },
    event.program,
    locations.flatMap((itm: NormalizedLocation) => itm.merchant_ids),
    [MatchStatus.MATCH],
    payment_matches
  );

  const depositExceptions = await posDepositService.findPosDeposits(
    {
      minDate:
        event.period.from === event.period.to
          ? format(
              subBusinessDays(
                parse(event.period.to, 'yyyy-MM-dd', new Date()),
                1
              ),
              'yyyy-MM-dd'
            )
          : format(
              subBusinessDays(
                parse(event.period.from, 'yyyy-MM-dd', new Date()),
                1
              ),
              'yyyy-MM-dd'
            ),
      maxDate: event.period.to,
    },
    event.program,
    locations.flatMap((itm: NormalizedLocation) => itm.merchant_ids),
    [MatchStatus.EXCEPTION]
  );

  const roundThreeMatchedPayments =
    await paymentService.findPosPaymentsByMatchedDepositId(
      matchedDeposits.filter(
        (itm) => itm.heuristic_match_round === PosHeuristicRound.THREE
      ),

      pos_deposit_matches
    );
  const roundThreeMatchedDeposits =
    await posDepositService.findPosDepositsByPaymentMatch(
      matchedPayments.filter(
        (itm) => itm.heuristic_match_round === PosHeuristicRound.THREE
      ),
      payment_matches
    );

  return {
    posPayments: [
      ...pendingAndInProgressPayments,
      ...matchedPayments,
      ...roundThreeMatchedPayments,
      ...paymentExceptions,
    ],
    posDeposits: [
      ...pendingAndInProgressDeposits,
      ...matchedDeposits,
      ...roundThreeMatchedDeposits,
      ...depositExceptions,
    ],
  };
};
/**
 * Query for the cash and pos deposits for the current month, up to the report date of the current month
 * @param app
 * @param event
 * @param locations
 * @returns
 */
const getPageThreeDeposits = async (
  app: INestApplicationContext,
  event: ReportConfig,
  locations: NormalizedLocation[]
): Promise<{
  pageThreeDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] };
  pageThreeDepositDates: DateRange;
}> => {
  const cashDepositService = app.get(CashDepositService);
  const posDepositService = app.get(PosDepositService);
  const maxDate = parse(event.period.to, 'yyyy-MM-dd', new Date());
  /* extract the month from the "from-date"*/
  const minDate = new Date(
    getYear(parse(event.period.from, 'yyyy-MM-dd', new Date())),
    getMonth(parse(event.period.from, 'yyyy-MM-dd', new Date())),
    1
  );

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
    pageThreeDeposits: { cash: cashDepositsResults, pos: posDeposits },
    pageThreeDepositDates: dateRange,
  };
};
