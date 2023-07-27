import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Context, SNSEvent } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { format, parse, subBusinessDays } from 'date-fns';
import { FindOptionsOrderValue } from 'typeorm';
import { checkFilesUploadedToday, getFilesUploadedByFileName } from './helpers';
import { handler as reportHandler } from './report';
import { AppModule } from '../app.module';
import { MatchStatus } from '../common/const';
import { Ministries, NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationService } from '../location/location.service';
import { NotificationService } from '../notification/notification.service';
import { ParseService } from '../parse/parse.service';
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
  const maxNumDaysToReconcile = 31;

  const currentDate = process.env.OVERRIDE_RECONCILIATION_DATE
    ? parse(process.env.OVERRIDE_RECONCILIATION_DATE, 'yyyy-MM-dd', new Date())
    : subBusinessDays(new Date(), 1);

  const reconciliationMaxDate = currentDate;

  const reconciliationMinDate = subBusinessDays(
    reconciliationMaxDate,
    maxNumDaysToReconcile
  );

  const ministry = Ministries.SBC;

  const cashExceptionsService = app.get(CashExceptionsService);
  const cashReconciliationService = app.get(CashReconciliationService);
  const posReconciliationService = app.get(PosReconciliationService);
  const cashDepositService = app.get(CashDepositService);
  const paymentService = app.get(PaymentService);
  const posDepositService = app.get(PosDepositService);
  const locationService = app.get(LocationService);
  const reportingService = app.get(ReportingService);
  const notificationService = app.get(NotificationService);
  const parseService = app.get(ParseService);

  appLogger.log({ event, _context }, 'RECONCILE EVENT');

  const snsService = app.get(SnsManagerService);

  const reconcile = async () => {
    const byPassFileValidityCheck = process.env.BYPASS_FILE_VALIDITY === 'true';
    byPassFileValidityCheck
      ? await getFilesUploadedByFileName(parseService, reconciliationMaxDate)
      : await checkFilesUploadedToday(notificationService, Ministries.SBC);

    const locations: NormalizedLocation[] =
      await locationService.getLocationsBySource(ministry);

    const allPosPaymentsInDates = await paymentService.findPosPayments(
      {
        minDate: format(reconciliationMinDate, 'yyyy-MM-dd'),
        maxDate: format(reconciliationMaxDate, 'yyyy-MM-dd'),
      },
      locations.map((itm) => itm.location_id),
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    // Get all pending deposits whether its one day or many months
    const allPosDepositsInDates = await posDepositService.findPosDeposits(
      {
        minDate: format(reconciliationMinDate, 'yyyy-MM-dd'),
        maxDate: format(reconciliationMaxDate, 'yyyy-MM-dd'),
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
        format(subBusinessDays(reconciliationMaxDate, 2), 'yyyy-MM-dd'),
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
          parse(date, 'yyyy-MM-dd', new Date()) >= reconciliationMinDate &&
          parse(date, 'yyyy-MM-dd', new Date()) <= reconciliationMaxDate
      );

      for (const date of filtered) {
        const currentCashDepositDate = date;
        const previousCashDepositDate =
          filtered[filtered.indexOf(date) - 2] ??
          format(reconciliationMinDate, 'yyyy-MM-dd');

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
            from: format(reconciliationMinDate, 'yyyy-MM-dd'),
            to: format(reconciliationMaxDate, 'yyyy-MM-dd'),
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
                    from: format(reconciliationMinDate, 'yyyy-MM-dd'),
                    to: format(reconciliationMaxDate, 'yyyy-MM-dd'),
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
    return {
      success: true,
      message: 'Reconciliation completed successfully',
    };
  } catch (err) {
    appLogger.error(err);
  }
};
