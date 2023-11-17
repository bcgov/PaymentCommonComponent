import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import { format, getMonth, getYear, isMonday, parse } from 'date-fns';
import { AppModule } from '../app.module';
import {
  PaymentMethodClassification,
  DateRange,
  Ministries,
} from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { MinistryLocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { MAIL_TEMPLATE_ENUM } from '../notification/mail-templates';
import { MailService } from '../notification/mail.service';
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
  const mailService = app.get(MailService);
  appLogger.setContext('Report Lambda');
  appLogger.log({ _context });
  appLogger.log({ event });

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
  const reportDate = parse(dateRange.minDate, 'yyyy-MM-dd', new Date());

  const reportUrl = await reportingService.generateReport(
    dateRange,
    program,
    locations,
    { posDeposits, cashDeposits },
    { posPayments, cashPayments },
    pageThreeDeposits,
    pageThreeDepositDates
  );
  const month = reportDate.toLocaleString('en-US', { month: 'long' });
  console.log(month);
  const fieldEntries = [
    { fieldName: 'month_name', content: month },
    { fieldName: 'url', content: reportUrl },
    { fieldName: 'username', content: 'SBC' },
  ];

  if (
    (isMonday(new Date()) && new Date().getDate() <= 7) ||
    process.env.RUNTIME_ENV === 'tools'
  ) {
    await mailService.sendEmailAlertBulk(
      MAIL_TEMPLATE_ENUM.MONTHLY_REPORT,
      [process.env.SBC_SHARED_INBOX ?? ''],
      fieldEntries
    );
  }
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
  locations: MinistryLocationEntity[]
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
      locations.flatMap((itm) => itm.banks.map((itm) => itm.bank_id)),
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
