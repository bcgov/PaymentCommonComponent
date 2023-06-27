import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
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
  const startDate = parse(event.period.from, 'yyyy-MM-dd', new Date());
  const endDate = parse(event.period.to, 'yyyy-MM-dd', new Date());
  if (differenceInDays(startDate, endDate) > 31) {
    appLogger.log(
      'Date range input exceeds maximum range (31 days)',
      ReportingService.name
    );
    return;
  }
  if (isSaturday(endDate) || isSunday(endDate)) {
    appLogger.log(
      `Skipping Reconciliation Report generation for ${event.period.to} as it is a weekend`,
      ReportingService.name
    );
    return;
  }
  const reportingService = app.get(ReportingService);
  const locationService = app.get(LocationService);
  const locations = await locationService.getLocationsBySource(event.program);

  const { posDeposits, posPayments } = await getPosReportData(app, event);

  const { cashDeposits, cashPayments } = await getCashReportData(app, event);

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
  event: ReportConfig
): Promise<{
  cashDeposits: CashDepositEntity[];
  cashPayments: PaymentEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const cashDepositService = app.get(CashDepositService);

  const cashDeposits =
    await cashDepositService.findCashDepositsForDetailsReport(
      { minDate: event.period.from, maxDate: event.period.to },
      event.program
    );

  const cashPayments = await paymentService.findPaymentsForDetailsReport(
    { minDate: event.period.from, maxDate: event.period.to },
    PaymentMethodClassification.CASH,
    event.program
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
  event: ReportConfig
): Promise<{
  posPayments: PaymentEntity[];
  posDeposits: POSDepositEntity[];
}> => {
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);

  const posDeposits = await posDepositService.findAllByReconciledDate(
    { minDate: event.period.from, maxDate: event.period.to },
    event.program
  );

  const posPayments = await paymentService.findPaymentsForDetailsReport(
    { minDate: event.period.from, maxDate: event.period.to },
    PaymentMethodClassification.POS,
    event.program
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
    await cashDepositService.findCashDepositsForPageThreeReport(
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
