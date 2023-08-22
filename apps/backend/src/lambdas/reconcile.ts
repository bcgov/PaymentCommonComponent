import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { SNSEvent } from 'aws-lambda/trigger/sns';
import { format, parse, subBusinessDays } from 'date-fns';
import { generateLocalSNSMessage } from './helpers';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { NormalizedLocation } from '../constants';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
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
  const numDaysToReconcile = 31;

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

  const currentDate = parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date());

  const reconciliationMinDate = format(
    subBusinessDays(currentDate, numDaysToReconcile),
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
      dateRange.maxDate
    );

    const uploadedDailyFiles = daily?.files.map((itm) => itm.sourceFileType);
    const requiredDailyFiles = rule.requiredFiles.map((file) => file.fileType);

    if (
      !requiredDailyFiles.every((file) => uploadedDailyFiles?.includes(file))
    ) {
      throw new Error(
        `Incomplete dataset for this date ${dateRange.maxDate}. Please check the uploaded files.`
      );
    }
  };

  const reconcile = async () => {
    const locations: NormalizedLocation[] =
      await locationService.getLocationsBySource(program);

    const allPosPaymentsInDates = await paymentService.findPosPayments(
      dateRange,
      locations.map((itm) => itm.location_id),
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    // Get all pending deposits whether its one day or many months
    const allPosDepositsInDates = await posDepositService.findPosDeposits(
      dateRange,
      program,
      locations.flatMap((location) => location.merchant_ids.map((id) => id)),
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    for (const location of locations) {
      appLogger.log(
        `Pos Reconciliation: ${location.description} - ${reconciliationMaxDate}`
      );
      await posReconciliationService.reconcileByLocation(
        location,
        program,
        dateRange,
        allPosPaymentsInDates,
        allPosDepositsInDates
      );

      await cashReconciliationService.reconcileCashByLocation(
        location,
        program,
        dateRange
      );
    }
    reportEnabled && (await generateReport());
    isLocal && (await showConsoleReport());
  };

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
    await reconcile();
  } catch (err) {
    appLogger.error(err);
  }
};
