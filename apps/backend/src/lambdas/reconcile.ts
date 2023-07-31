import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { format, parse, subBusinessDays } from 'date-fns';
import { FindOptionsOrderValue } from 'typeorm';
import { configureReconciliationInputs } from './helpers';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { CashExceptionsService } from '../reconciliation/cash-exceptions.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { PosReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReportingService } from '../reporting/reporting.service';
import { SnsManagerService } from '../sns-manager/sns-manager.service';
import { PaymentService } from '../transaction/payment.service';

const SNS_RECONCILER_RESULTS_TOPIC = process.env.SNS_RECONCILER_RESULTS_TOPIC;

export const handler = async (event: SNSEvent, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(Logger);

  //TODO - confirm the allowable dates ranges and set ministry dynamically
  const numDaysToReconcile = 31;
  const cashExceptionsService = app.get(CashExceptionsService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(PosReconciliationService);
  const cashDepositService = app.get(CashDepositService);
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const notificationService = app.get(NotificationService);

  const {
    reconciliationMinDate,
    reconciliationMaxDate,
    currentDate,
    ministry,
    byPassFileValidity,
  } = configureReconciliationInputs(
    event.Records[0].Sns.Message as unknown,
    numDaysToReconcile
  );

  appLogger.log({ event, _context }, 'RECONCILE EVENT');

  const snsService = app.get(SnsManagerService);

  const reconcile = async () => {
    // PrsnsEvent reconciler from running for a program if no valid files today
    if (!byPassFileValidity) {
      const rule: FileIngestionRulesEntity =
        await notificationService.getRulesForProgram('SBC');

      if (!rule) {
        throw new Error('No rule for this program');
      }

      const daily = await notificationService.getDailyForRule(
        rule,
        reconciliationMaxDate
      );
      const uploadedDailyFiles = daily?.files.map((itm) => itm.sourceFileType);

      const requiredDailyFiles = rule.requiredFiles.map(
        (file) => file.fileType
      );

      if (
        !requiredDailyFiles.every((file) => uploadedDailyFiles?.includes(file))
      ) {
        throw new Error(
          `Incomplete dataset for this date ${reconciliationMaxDate}. Please check the uploaded files.`
        );
      }
    }
    const locations: NormalizedLocation[] =
      await locationService.getLocationsBySource(ministry);

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
      ministry,
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
      // TODO loop over dates and reconcile each day in order to set the current date for batches....
      const reconciled = await posReconciliationService.reconcile(
        location,
        locationPayments,
        locationDeposits,
        currentDate
      );

      appLogger.log({ reconciled }, PosReconciliationService.name);

      // Set exceptions for items still PENDING or IN PROGRESS for day before maxDate
      const exceptions = await posReconciliationService.setExceptions(
        location,
        ministry,
        format(
          subBusinessDays(
            parse(reconciliationMaxDate, 'yyyy-MM-dd', new Date()),
            2
          ),
          'yyyy-MM-dd'
        ),
        currentDate
      );

      appLogger.log({ exceptions }, PosReconciliationService.name);
    }

    const order: FindOptionsOrderValue = 'ASC';

    for (const location of locations) {
      const allCashDepositDatesPerLocation =
        await cashDepositService.findAllCashDepositDatesPerLocation(
          ministry,
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

      for (const date of filtered) {
        const currentCashDepositDate = date;
        const previousCashDepositDate =
          filtered[filtered.indexOf(date) - 2] ?? reconciliationMinDate;

        const dateRange = {
          minDate: previousCashDepositDate,
          maxDate: currentCashDepositDate,
        };

        //TODO replace current cashDepositDate with actual date
        const result = await cashReconciliationService.reconcileCash(
          location,
          ministry,
          dateRange,
          currentDate
        );

        appLogger.log({ result });
        //TODO replace current cashDepositDate with actual date
        const exceptions = await cashExceptionsService.setExceptions(
          location,
          ministry,
          previousCashDepositDate,
          currentDate
        );
        appLogger.log({ exceptions }, CashReconciliationService.name);
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

  try {
    await reconcile();
    const isLocal = process.env.RUNTIME_ENV === 'local';

    if (!isLocal) {
      const response: SNS.Types.PublishResponse = await snsService.publish(
        SNS_RECONCILER_RESULTS_TOPIC || '',
        JSON.stringify({
          period: {
            from: reconciliationMinDate,
            to: reconciliationMaxDate,
          },
          program: ministry,
        })
      );
      return {
        success: true,
        response,
      };
    } else {
      appLogger.log('Running locally, not sending to SNS');
      await showConsoleReport();
      await reportHandler(
        {
          Records: [
            {
              EventVersion: '',
              EventSubscriptionArn: '',
              EventSource: '',
              Sns: {
                Message: JSON.stringify({
                  period: {
                    from: reconciliationMinDate,
                    to: reconciliationMaxDate,
                  },
                  program: ministry,
                }),
                MessageId: '',
                MessageAttributes: {},
                Type: '',
                TopicArn: '',
                Subject: '',
                UnsubscribeUrl: '',
                SignatureVersion: '',
                Timestamp: new Date().toISOString(),
                Signature: '',
                SigningCertUrl: '',
              },
            },
          ],
        },
        _context
      );
    }
  } catch (err) {
    appLogger.error(err);
  }
};
