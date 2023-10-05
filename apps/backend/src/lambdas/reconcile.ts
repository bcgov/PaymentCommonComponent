import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { SNSEvent } from 'aws-lambda/trigger/sns';
import { format, parse, subBusinessDays } from 'date-fns';
import { generateLocalSNSMessage } from './helpers';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import {
  DateRange,
  Ministries,
  NormalizedLocation,
  PaymentMethodClassification,
} from '../constants';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { heuristics } from '../reconciliation/ministryHeuristics';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReportingService } from '../reporting/reporting.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';
import { PaymentService } from '../transaction/payment.service';

export const handler = async (event: SNSEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);

  appLogger.setContext('Reconcile Lambda');
  appLogger.log({ event, _context });

  const posReconciliationService = app.get(PosReconciliationService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const locationService = app.get(LocationService);
  const notificationService = app.get(NotificationService);
  const snsService = app.get(SnsManagerService);
  const reportingService = app.get(ReportingService);
  const numDaysToReconcile = 14;

  const isLocal = process.env.RUNTIME_ENV === 'local';

  const posDepositService = app.get(PosDepositService);
  const paymentService = app.get(PaymentService);

  /**
   * Reconciliation Max Date is the current date in the automated flow (PROD/TEST) and is derived from a loop in the batch reconcilaition flow
   * Reconciliation Min Date is the Max date minus the number of days to reconcile
   */

  const { program, reconciliationMaxDate, reportEnabled, byPassFileValidity } =
    typeof event.Records[0].Sns.Message === 'string'
      ? await JSON.parse(event.Records[0].Sns.Message)
      : event.Records[0].Sns.Message;

  const currentDate = format(
    subBusinessDays(parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date()), 1),
    'yyyy-MM-dd'
  );
  const reconciliationMinDate = format(
    subBusinessDays(
      parse(currentDate, 'yyyy-MM-dd', new Date()),
      numDaysToReconcile
    ),
    'yyyy-MM-dd'
  );
  const dateRange = {
    minDate: reconciliationMinDate,
    maxDate: reconciliationMaxDate,
  };
  const fileCheck = async () => {
    const rule: FileIngestionRulesEntity =
      await notificationService.getRulesForProgram('SBC');

    if (!rule) {
      throw new Error('No rule for this program');
    }

    const daily = await notificationService.getProgramDailyUploadRecord(
      rule,
      format(
        subBusinessDays(
          parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date()),
          1
        ),
        'yyyy-MM-dd'
      )
    );

    const uploadedDailyFiles = daily?.files.map((itm) => itm.sourceFileType);
    const requiredDailyFiles = rule.requiredFiles.map((file) => file.fileType);

    if (
      !requiredDailyFiles.every((file) => uploadedDailyFiles?.includes(file))
    ) {
      throw new Error(
        `Incomplete dataset for this date ${reconciliationMaxDate}. Please check the uploaded files.`
      );
    }
  };

  const locations = await locationService.getLocationsBySource(program);

  const showConsoleReport = async () => {
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

  const generateReport = async () => {
    const topic = process.env.SNS_TRIGGER_REPORT_TOPIC_ARN;

    !isLocal
      ? await snsService.publish(
          topic,
          JSON.stringify({
            program,
            period: {
              to: reconciliationMaxDate,
              from: reconciliationMinDate,
            },
          })
        )
      : await reportHandler(
          generateLocalSNSMessage({
            program,
            period: {
              to: reconciliationMaxDate,
              from: reconciliationMinDate,
            },
          })
        );
  };

  try {
    !byPassFileValidity && (await fileCheck());
    await reconcilePos(
      posReconciliationService,
      currentDate,
      paymentService,
      locations,
      program,
      posDepositService,
      appLogger
    );
    await findPosExceptions(
      posReconciliationService,
      currentDate,
      paymentService,
      locations,
      program,
      posDepositService,
      appLogger
    );
    await reconcileCash(
      dateRange,
      locations,
      cashReconciliationService,
      program,
      appLogger
    );
    reportEnabled && (await generateReport());
    isLocal && (await showConsoleReport());
  } catch (err) {
    appLogger.error(err);
  }
};

const findPosExceptions = async (
  posReconciliationService: PosReconciliationService,
  currentDate: string,
  paymentService: PaymentService,
  locations: NormalizedLocation[],
  program: Ministries,
  posDepositService: PosDepositService,
  appLogger: AppLogger
) => {
  posReconciliationService.setExceptionsDate(currentDate);

  const paymentsInprogress =
    await paymentService.findPaymentsByMinistryAndMethod(
      program,
      format(posReconciliationService.exceptionsDate, 'yyyy-MM-dd'),
      PaymentMethodClassification.POS,
      [MatchStatus.IN_PROGRESS]
    );
  const depositsInprogress = await posDepositService.findPosDeposits(
    program,
    format(posReconciliationService.exceptionsDate, 'yyyy-MM-dd'),
    [MatchStatus.IN_PROGRESS]
  );
  for (const location of locations) {
    posReconciliationService.setPendingPayments(
      paymentsInprogress.filter(
        (itm) => itm.transaction.location_id === location.location_id
      )
    );
    posReconciliationService.setPendingDeposits(
      depositsInprogress.filter((itm) =>
        location.merchant_ids.includes(itm.merchant_id)
      )
    );

    const exceptions = await posReconciliationService.setExceptions();

    appLogger.log(exceptions);
  }
};

const reconcilePos = async (
  posReconciliationService: PosReconciliationService,
  currentDate: string,
  paymentService: PaymentService,
  locations: NormalizedLocation[],
  program: Ministries,
  posDepositService: PosDepositService,
  appLogger: AppLogger
) => {
  const payments = await paymentService.findPaymentsByMinistryAndMethod(
    program,
    currentDate,
    PaymentMethodClassification.POS,
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );
  posReconciliationService.setHeuristics(heuristics[program]);
  posReconciliationService.setReconciliationDate(currentDate);

  const deposits = await posDepositService.findPosDeposits(
    program,
    currentDate,
    [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
  );

  for (const location of locations) {
    posReconciliationService.setPendingPayments(
      payments.filter(
        (itm) => itm.transaction.location_id === location.location_id
      )
    );
    posReconciliationService.setPendingDeposits(
      deposits.filter((itm) => location.merchant_ids.includes(itm.merchant_id))
    );
    posReconciliationService.setHeuristicMatchRound(heuristics[program][0]);
    posReconciliationService.setMatchedPayments([]);
    posReconciliationService.setMatchedDeposits([]);

    const reconciled = await posReconciliationService.reconcile(location);

    appLogger.log(reconciled);
  }
};

const reconcileCash = async (
  dateRange: DateRange,
  locations: NormalizedLocation[],
  cashReconciliationService: CashReconciliationService,
  program: Ministries,
  appLogger: AppLogger
) => {
  for (const location of locations) {
    appLogger.log(
      `Pos Reconciliation: ${location.description} - ${dateRange.maxDate}`
    );
    const reconcileCash =
      await cashReconciliationService.reconcileCashByLocation(
        location,
        program,
        dateRange
      );
    appLogger.log(reconcileCash);
  }
};
