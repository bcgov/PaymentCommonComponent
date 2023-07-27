import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import {
  differenceInDays,
  format,
  getMonth,
  getYear,
  isSaturday,
  isSunday,
  parse,
} from 'date-fns';
import { AppModule } from '../app.module';
import {
  DateRange,
  NormalizedLocation,
  PaymentMethodClassification,
} from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { ReconciliationConfigInput } from '../reconciliation/types';
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
export const handler = async (event: SNSEvent, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const message: ReconciliationConfigInput = JSON.parse(
    event.Records[0].Sns.Message
  );
  const startDate = parse(message.period.from, 'yyyy-MM-dd', new Date());
  const endDate = parse(message.period.to, 'yyyy-MM-dd', new Date());

  const maxReportDays = 31;
  const BUSINESS_DAY_LEEWAY = 1;
  if (differenceInDays(startDate, endDate) > maxReportDays) {
    appLogger.log(
      `Date range input exceeds maximum range (${maxReportDays} days)`,
      ReportingService.name
    );
    return;
  }
  if (isSaturday(endDate) || isSunday(endDate)) {
    appLogger.log(
      `Skipping Reconciliation Report generation for ${message.period.to} as it is a weekend`,
      ReportingService.name
    );
    return;
  }
  const reportingService = app.get(ReportingService);
  const locationService = app.get(LocationService);
  const locations = await locationService.getLocationsBySource(message.program);

  const { posDeposits, posPayments } = await getPosReportData(
    app,
    message,
    BUSINESS_DAY_LEEWAY
  );

  const { cashDeposits, cashPayments } = await getCashReportData(
    app,
    message,
    BUSINESS_DAY_LEEWAY
  );

  const { pageThreeDeposits, pageThreeDepositDates } =
    await getPageThreeDeposits(app, message, locations);

  appLogger.log({ context });
  appLogger.log({ event });

  await reportingService.generateReport(
    message,
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
  message: ReportConfig,
  BUSINESS_DAY_LEEWAY: number
): Promise<{
  cashDeposits: CashDepositEntity[];
  cashPayments: PaymentEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const cashDepositService = app.get(CashDepositService);

  const cashDeposits =
    await cashDepositService.findCashDepositsForDetailsReport(
      { minDate: message.period.from, maxDate: message.period.to },
      message.program,
      BUSINESS_DAY_LEEWAY
    );

  const cashPayments = await paymentService.findPaymentsForDetailsReport(
    { minDate: message.period.from, maxDate: message.period.to },
    PaymentMethodClassification.CASH,
    message.program,
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
  message: ReportConfig,
  BUSINESS_DAY_LEEWAY: number
): Promise<{
  posPayments: PaymentEntity[];
  posDeposits: POSDepositEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);

  const posDeposits = await posDepositService.findAllByReconciledDate(
    { minDate: message.period.from, maxDate: message.period.to },
    message.program,
    BUSINESS_DAY_LEEWAY
  );

  const posPayments = await paymentService.findPaymentsForDetailsReport(
    { minDate: message.period.from, maxDate: message.period.to },
    PaymentMethodClassification.POS,
    message.program,
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
  message: ReportConfig,
  locations: NormalizedLocation[]
): Promise<{
  pageThreeDeposits: { cash: CashDepositEntity[]; pos: POSDepositEntity[] };
  pageThreeDepositDates: DateRange;
}> => {
  const cashDepositService = app.get(CashDepositService);
  const posDepositService = app.get(PosDepositService);
  const maxDate = parse(message.period.to, 'yyyy-MM-dd', new Date());
  /* extract the month from the "from-date"*/
  const minDate = new Date(
    getYear(parse(message.period.from, 'yyyy-MM-dd', new Date())),
    getMonth(parse(message.period.from, 'yyyy-MM-dd', new Date())),
    1
  );

  const dateRange = {
    minDate: format(minDate, 'yyyy-MM-dd'),
    maxDate: format(maxDate, 'yyyy-MM-dd'),
  };
  const cashDepositsResults: CashDepositEntity[] =
    await cashDepositService.findCashDepositsForPageThreeReport(
      locations.map((itm) => itm.pt_location_id),
      message.program,
      dateRange
    );

  const posDeposits: POSDepositEntity[] =
    await posDepositService.findPOSBySettlementDate(
      locations,
      message.program,
      dateRange
    );

  return {
    pageThreeDeposits: { cash: cashDepositsResults, pos: posDeposits },
    pageThreeDepositDates: dateRange,
  };
};
