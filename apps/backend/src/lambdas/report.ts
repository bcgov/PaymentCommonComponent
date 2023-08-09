import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import { format, getMonth, getYear, parse } from 'date-fns';
import { AppModule } from '../app.module';
import {
  PaymentMethodClassification,
  NormalizedLocation,
  DateRange,
  Ministries,
} from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
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
export const handler = async (event: SNSEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  appLogger.log({ event, _context }, 'REPORT EVENT');

  const { program, period } =
    typeof event.Records[0].Sns.Message === 'string'
      ? await JSON.parse(event.Records[0].Sns.Message)
      : event.Records[0].Sns.Message;

  const BUSINESS_DAY_LEEWAY = 1;

  const reportingService = app.get(ReportingService);
  const locationService = app.get(LocationService);
  const locations = await locationService.getLocationsBySource(program);

  const dateRange = {
    minDate: period.from,
    maxDate: period.to,
  };

  const { posDeposits, posPayments } = await getPosReportData(
    app,
    dateRange,
    program,
    BUSINESS_DAY_LEEWAY
  );

  const { cashDeposits, cashPayments } = await getCashReportData(
    app,
    dateRange,
    program,
    BUSINESS_DAY_LEEWAY
  );

  const { pageThreeDeposits, pageThreeDepositDates } =
    await getPageThreeDeposits(app, dateRange, program, locations);

  await reportingService.generateReport(
    dateRange,
    program,
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
  dateRange: DateRange,
  program: Ministries,
  BUSINESS_DAY_LEEWAY: number
): Promise<{
  cashDeposits: CashDepositEntity[];
  cashPayments: PaymentEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const cashDepositService = app.get(CashDepositService);

  const cashDeposits =
    await cashDepositService.findCashDepositsForDetailsReport(
      dateRange,
      program,
      BUSINESS_DAY_LEEWAY
    );

  const cashPayments = await paymentService.findPaymentsForDetailsReport(
    dateRange,
    PaymentMethodClassification.CASH,
    program,
    BUSINESS_DAY_LEEWAY
  );

  return {
    cashDeposits,
    cashPayments,
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
  dateRange: DateRange,
  program: Ministries,
  BUSINESS_DAY_LEEWAY: number
): Promise<{
  posPayments: PaymentEntity[];
  posDeposits: POSDepositEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);

  const posDeposits = await posDepositService.findAllByReconciledDate(
    dateRange,
    program,
    BUSINESS_DAY_LEEWAY
  );

  const posPayments = await paymentService.findPaymentsForDetailsReport(
    dateRange,
    PaymentMethodClassification.POS,
    program,
    BUSINESS_DAY_LEEWAY
  );
  return {
    posDeposits,
    posPayments,
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
  dateRange: DateRange,
  program: Ministries,
  locations: NormalizedLocation[]
): Promise<{
  pageThreeDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] };
  pageThreeDepositDates: DateRange;
}> => {
  const cashDepositService = app.get(CashDepositService);
  const posDepositService = app.get(PosDepositService);
  const maxDate = parse(dateRange.maxDate, 'yyyy-MM-dd', new Date());
  /* extract the month from the "from-date"*/
  const minDate = new Date(
    getYear(parse(dateRange.minDate, 'yyyy-MM-dd', new Date())),
    getMonth(parse(dateRange.minDate, 'yyyy-MM-dd', new Date())),
    1
  );
  const formattedDateRangeForPageThree = {
    minDate: format(minDate, 'yyyy-MM-dd'),
    maxDate: format(maxDate, 'yyyy-MM-dd'),
  };

  const cashDepositsResults: CashDepositEntity[] =
    await cashDepositService.findCashDepositsForPageThreeReport(
      locations.map((itm) => itm.pt_location_id),
      program,
      formattedDateRangeForPageThree
    );

  const posDeposits: POSDepositEntity[] =
    await posDepositService.findPOSBySettlementDate(
      locations,
      program,
      formattedDateRangeForPageThree
    );

  return {
    pageThreeDeposits: { cash: cashDepositsResults, pos: posDeposits },
    pageThreeDepositDates: dateRange,
  };
};
