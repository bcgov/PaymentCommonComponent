import { Inject } from '@nestjs/common';
import { format, parse, subBusinessDays } from 'date-fns';
import {
  CashDepositDetailsReport,
  POSDepositDetailsReport,
  PaymentDetailsReport,
  DetailsReport,
} from './detailed-report';
import { DailySummary, ReportConfig } from './interfaces';
import { rowStyle } from './styles';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationEntity } from '../location/entities';
import { PaymentEntity } from '../transaction/entities';
import { PaymentService } from '../transaction/payment.service';

export class DetailedReportService {
  constructor(
    @Inject(PaymentService)
    private paymentService: PaymentService,
    @Inject(CashDepositService)
    private cashDepositService: CashDepositService,
    @Inject(PosDepositService)
    private posDepositService: PosDepositService
  ) {}
  /**
   *
   * @param date
   * @param location
   * @param program
   * @returns
   */
  async findPaymentDataForDailySummary(
    date: string,
    location: LocationEntity,
    program: Ministries
  ): Promise<DailySummary> {
    const payments = await this.paymentService.findPaymentsForDailySummary(
      location,
      date
    );
    const exceptions = payments.filter(
      (itm: PaymentEntity) => itm.status === MatchStatus.EXCEPTION
    ).length;

    const total = payments.length;

    const unmatchedPercentage =
      total != 0 ? parseFloat(((exceptions / total) * 100).toFixed(2)) : 0;

    /*eslint-disable */
    const totalSum = payments.reduce(
      (acc: number, itm: PaymentEntity) => (acc += itm.amount),
      0
    );

    return {
      values: {
        program,
        date,
        location_id: location.location_id,
        location_name: location.description,
        total_payments: total,
        total_unmatched_payments: exceptions,
        percent_unmatched: unmatchedPercentage,
        total_sum: parseFloat(totalSum.toFixed(2)),
      },
      style: rowStyle(exceptions !== 0),
    };
  }

  async findCashPaymentsForDetailedReport(
    location: LocationEntity,
    dateRange: DateRange,
    twoMostRecentDepositDates?: DateRange
  ): Promise<PaymentDetailsReport[]> {
    const currentCashPaymentsByDepositDates: PaymentEntity[] =
      twoMostRecentDepositDates
        ? await this.paymentService.findCashPayments(
            twoMostRecentDepositDates,
            location,
            [MatchStatus.EXCEPTION, MatchStatus.MATCH]
          )
        : [];

    const allPendingAndInProgressCashPayments: PaymentEntity[] =
      await this.paymentService.findCashPayments(dateRange, location, [
        MatchStatus.PENDING,
        MatchStatus.IN_PROGRESS,
      ]);

    return [
      ...allPendingAndInProgressCashPayments.map(
        (itm) => new PaymentDetailsReport(location, itm)
      ),
      ...currentCashPaymentsByDepositDates.map(
        (itm) =>
          new PaymentDetailsReport(location, itm, twoMostRecentDepositDates)
      ),
    ];
  }

  async findCashDataForDetailedReport(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ): Promise<{
    payments: PaymentDetailsReport[];
    deposits: CashDepositDetailsReport[];
  }> {
    const allCashDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsForReport(
        location,
        program,
        dateRange
      );

    const currentCashDeposits = allCashDeposits
      .filter((itm) => itm.deposit_date === dateRange.maxDate)
      .filter(
        (itm) =>
          itm.status === MatchStatus.MATCH ||
          itm.status === MatchStatus.EXCEPTION
      );

    const pendingAndInProgressCashDeposits = allCashDeposits.filter(
      (itm: CashDepositEntity) =>
        itm.status === MatchStatus.PENDING ||
        itm.status === MatchStatus.IN_PROGRESS
    );

    const cashDepositDatesForPaymentsQuery =
      currentCashDeposits.length > 0 &&
      Array.from(
        new Set(allCashDeposits.map((itm) => itm.deposit_date))
      ).reverse();

    const twoMostRecentDepositDates = cashDepositDatesForPaymentsQuery && {
      minDate: cashDepositDatesForPaymentsQuery[1],
      maxDate: cashDepositDatesForPaymentsQuery[0],
    };

    const payments = await this.findCashPaymentsForDetailedReport(
      location,
      dateRange,
      twoMostRecentDepositDates || undefined
    );

    const deposits = [
      ...pendingAndInProgressCashDeposits.map(
        (itm) => new CashDepositDetailsReport(location, itm)
      ),
      ...currentCashDeposits.map(
        (itm) => new CashDepositDetailsReport(location, itm)
      ),
    ];

    return {
      payments,
      deposits,
    };
  }

  async findPosDataForDetailedReport(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ): Promise<{
    payments: PaymentDetailsReport[];
    deposits: POSDepositDetailsReport[];
  }> {
    dateRange = {
      minDate: format(
        subBusinessDays(parse(dateRange.maxDate, 'yyyy-MM-dd', new Date()), 2),
        'yyyy-MM-dd'
      ),

      maxDate: format(
        subBusinessDays(parse(dateRange.maxDate, 'yyyy-MM-dd', new Date()), 1),
        'yyyy-MM-dd'
      ),
    };

    const posPayments: PaymentEntity[] =
      await this.paymentService.findPosPayments(dateRange, location);

    const posDeposits: POSDepositEntity[] =
      await this.posDepositService.findPOSDeposits(
        dateRange,
        program,
        location.location_id
      );
    return {
      payments: posPayments.map(
        (itm) => new PaymentDetailsReport(location, itm)
      ),
      deposits: posDeposits.map(
        (itm) => new POSDepositDetailsReport(location, itm)
      ),
    };
  }
  /**
   *
   * @param config
   * @param location
   * @returns
   */
  async findDataForDetailedReport(
    config: ReportConfig,
    location: LocationEntity
  ): Promise<DetailsReport[]> {
    const dateRange: DateRange = {
      minDate: config.period.from,
      maxDate: config.period.to,
    };
    const cashData = await this.findCashDataForDetailedReport(
      location,
      config.program,
      dateRange
    );
    const posData = await this.findPosDataForDetailedReport(
      location,
      config.program,
      dateRange
    );
    return [
      ...posData.deposits,
      ...posData.payments,
      ...cashData.deposits,
      ...cashData.payments,
    ];
  }
}
