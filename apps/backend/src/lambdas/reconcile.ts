import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import { format, parse, subBusinessDays } from 'date-fns';
import { FindOptionsOrderValue } from 'typeorm';
import { generateLocalSNSMessage } from './helpers';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { Ministries, NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReportingService } from '../reporting/reporting.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';
import { PaymentService } from '../transaction/payment.service';

export const handler = async (event: SNSEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = new AppLogger();
  appLogger.setContext('Reconcile Lambda');
  const cashExceptionsService = app.get(CashExceptionsService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(PosReconciliationService);
  const cashDepositService = app.get(CashDepositService);
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);
  const locationService = app.get(LocationService);
  const notificationService = app.get(NotificationService);
  const snsService = app.get(SnsManagerService);
  const isLocal = process.env.RUNTIME_ENV === 'local';
  const reportingService = app.get(ReportingService);

  appLogger.log({ event, _context }, 'RECONCILE EVENT');

  const { program, period, reportEnabled } =
    typeof event.Records[0].Sns.Message === 'string'
      ? await JSON.parse(event.Records[0].Sns.Message)
      : event.Records[0].Sns.Message;

  const reconciliationMinDate = period.from;
  const reconciliationMaxDate = period.to;

  const currentDate = parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date());

  const fileCheck = async () => {
    const rule: FileIngestionRulesEntity =
      await notificationService.getRulesForProgram('SBC');

    if (!rule) {
      throw new Error('No rule for this program');
    }
    const daily = await notificationService.getProgramDailyUploadRecord(
      rule,
      reconciliationMaxDate
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

  const reconcile = async () => {
    const locations: NormalizedLocation[] =
      await locationService.getLocationsBySource(program);

    const allPosPaymentsInDates = await paymentService.findPosPayments(
      {
        minDate: reconciliationMinDate,
        maxDate: reconciliationMaxDate,
      },
      locations.map((itm) => itm.location_id),
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    // Get all pending deposits whether its one day or many months
    const allPosDepositsInDates = await posDepositService.findPosDeposits(
      {
        minDate: reconciliationMinDate,
        maxDate: reconciliationMaxDate,
      },
      program,
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

      await posReconciliationService.reconcile(
        location,
        locationPayments,
        locationDeposits,
        currentDate
      );

      // Set exceptions for items still PENDING or IN PROGRESS for day before maxDate
      await posReconciliationService.setExceptions(
        location,
        program,
        format(
          subBusinessDays(
            parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date()),
            2
          ),
          'yyyy-MM-dd'
        ),
        currentDate
      );
    }

    const order: FindOptionsOrderValue = 'ASC';

    for (const location of locations) {
      const allCashDepositDatesPerLocation =
        await cashDepositService.findAllCashDepositDatesPerLocation(
          program,
          location.pt_location_id,
          order
        );

      const filtered = allCashDepositDatesPerLocation.filter(
        (date: string) =>
          parse(date, 'yyyy-MM-dd', new Date()) >=
            parse(reconciliationMinDate, 'yyyy-MM-dd', new Date()) &&
          parse(date, 'yyyy-MM-dd', new Date()) <=
            parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date())
      );
      appLogger.log(
        `Reconciliation Cash: ${location.description} - ${location.location_id}`,
        CashReconciliationService.name
      );
      for (const date of filtered) {
        const currentCashDepositDate = date;
        const previousCashDepositDate =
          filtered[filtered.indexOf(date) - 2] ?? reconciliationMinDate;

        const dateRange = {
          minDate: previousCashDepositDate,
          maxDate: currentCashDepositDate,
        };

        await cashReconciliationService.reconcileCash(
          location,
          program,
          dateRange,
          currentDate
        );

        await cashExceptionsService.setExceptions(
          location,
          program,
          previousCashDepositDate,
          currentDate
        );
      }
    }
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
    const message = {
      period: {
        from: reconciliationMinDate,
        to: reconciliationMaxDate,
      },
      program,
    };

    if (isLocal) {
      appLogger.log('Running locally, not sending to SNS');
      await showConsoleReport();
      reportEnabled &&
        (await reportHandler(generateLocalSNSMessage(message), _context));
    }
    if (!isLocal) {
      appLogger.log('Publishing SNS to reconcile', 'ReconciliationLambda');

      const topic = process.env.SNS_RECONCILER_RESULTS_TOPIC;

      await snsService.publish(
        topic,
        JSON.stringify({
          program: Ministries.SBC,
          period: {
            to: reconciliationMaxDate,
            from: reconciliationMinDate,
          },
        })
      );
    }
  };

  try {
    await fileCheck();
    await reconcile();
    await generateReport();
  } catch (err) {
    appLogger.error(err);
  }
};
