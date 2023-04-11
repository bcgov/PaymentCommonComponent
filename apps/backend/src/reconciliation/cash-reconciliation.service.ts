import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReconciliationType,
  AggregatedPayment,
  CashReconciliationOutput
} from './types';
import { Dates, MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';
import { CashDepositEntity } from './../deposits/entities/cash-deposit.entity';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(PaymentService) private paymentService: PaymentService
  ) {}
  /**
   *
   * @param program
   * @param date
   * @param location
   * @returns
   * @description Find the previous two deposit dates and the current date
   */
  public async getDateRangeForReconciliation(
    program: Ministries,
    date: string,
    location: LocationEntity
  ): Promise<DateRange | void> {
    /* use descending order instead of acsending order */
    const reverseDates = true;
    const depositDates = await this.cashDepositService.findDistinctDepositDates(
      program,
      {
        from_date: Dates.FISCAL_YEAR_START_DATE,
        to_date: date
      },
      location,
      reverseDates
    );
    if (depositDates.length === 0) {
      this.appLogger.log(
        `No deposit dates found for ${location.description} in ${program}`
      );
      return;
    }
    const dateRangeForReconciliation = {
      from_date: depositDates[2] ?? Dates.FISCAL_YEAR_START_DATE,
      to_date: depositDates[0]
    };

    this.appLogger.log(
      `CURRENT DATE: ${dateRangeForReconciliation.to_date}`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `PREVIOUS (2) DEPOSIT DATES: ${dateRangeForReconciliation.from_date}`,
      CashReconciliationService.name
    );
    return dateRangeForReconciliation;
  }
  /**
   *
   * @param event
   * @returns
   * @description Find all deposit dates for a given location and program
   */
  public async getAllDepositDatesByLocation(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<string[]> {
    const dates = await this.cashDepositService.findDistinctDepositDates(
      program,
      dateRange,
      location
    );
    return dates;
  }
  /**
   *
   * @param event
   * @returns PaymentEntity[]
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async findExceptions(
    location: LocationEntity,
    program: Ministries,
    date: string
  ): Promise<{
    payments: unknown[];
    deposits: unknown[];
  } | void> {
    const dates: DateRange | void = await this.getDateRangeForReconciliation(
      program,
      date,
      location
    );

    if (!dates) {
      return;
    }

    const payments: PaymentEntity[] =
      await this.paymentService.findPaymentsExceptions(
        location,
        dates.from_date
      );

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findExceptions(
        dates.from_date,
        program,
        location
      );

    if (payments.length === 0) {
      return;
    }
    const paymentExceptions: PaymentEntity[] =
      await this.paymentService.updatePayments(
        payments.map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.EXCEPTION
        }))
      );

    const depositExceptions: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(
        deposits.map((itm) => ({
          ...itm,
          status: MatchStatus.EXCEPTION
        }))
      );

    return {
      payments: paymentExceptions,
      deposits: depositExceptions
    };
  }

  /**
   *
   * @param aggregatedPayments
   * @param deposits
   * @returns
   */

  public matchPaymentsToDeposits(
    aggregatedPayments: AggregatedPayment[],
    deposits: CashDepositEntity[]
  ): {
    aggregatedPayments: AggregatedPayment[];
    deposits: CashDepositEntity[];
  } {
    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of aggregatedPayments.entries()) {
        if (
          payment.status !== MatchStatus.MATCH &&
          deposit.status !== MatchStatus.MATCH &&
          payment.payments.every(
            ({ cash_deposit_match }) => cash_deposit_match === undefined
          ) &&
          Math.abs(deposit.deposit_amt_cdn - payment.amount) < 0.001
        ) {
          deposits[dindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].payments = payment.payments.map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.MATCH,
            cash_deposit_match: deposits[dindex]
          }));

          this.appLogger.log(
            `MATCHED PAYMENT: ${payment.amount} TO DEPOSIT: ${deposit.deposit_amt_cdn}`,
            CashReconciliationService.name
          );
          break;
        }
      }
    }

    return {
      aggregatedPayments,
      deposits
    };
  }
  /**
   *
   * @param location
   * @param program
   * @param date
   * @returns
   */
  public async reconcileCash(
    location: LocationEntity,
    program: Ministries,
    date: string
  ): Promise<CashReconciliationOutput | unknown> {
    const dateRange: DateRange | void =
      await this.getDateRangeForReconciliation(program, date, location);

    if (!dateRange) {
      this.appLogger.log(
        'No previous or current dates found. Skipping...',
        CashReconciliationService.name
      );
      return;
    }

    const aggregatedPayments: AggregatedPayment[] =
      await this.paymentService.getAggregatedPaymentsByCashDepositDates(
        dateRange,
        location
      );

    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        program,
        dateRange.to_date,
        location,
        [MatchStatus.IN_PROGRESS, MatchStatus.PENDING]
      );

    if (pendingDeposits.length === 0 || aggregatedPayments.length === 0) {
      return {
        message: 'No pending payments or deposits found'
      };
    }

    this.appLogger.log(
      `MATCHING: ${aggregatedPayments.length} AGGREGATED PAYMENTS to ${pendingDeposits.length} DEPOSITS`,
      CashReconciliationService.name
    );

    const afterMatch: {
      aggregatedPayments: AggregatedPayment[];
      deposits: CashDepositEntity[];
    } = this.matchPaymentsToDeposits(aggregatedPayments, pendingDeposits);

    const matchedPayments: AggregatedPayment[] =
      afterMatch.aggregatedPayments.filter(
        (itm: AggregatedPayment) => itm.status === MatchStatus.MATCH
      );
    const matchedDeposits: CashDepositEntity[] = afterMatch.deposits.filter(
      (itm: CashDepositEntity) => itm.status === MatchStatus.MATCH
    );
    const inProgressPayments: PaymentEntity[] = afterMatch.aggregatedPayments
      .filter(
        (aggPayment: AggregatedPayment) =>
          aggPayment.status !== MatchStatus.MATCH
      )
      .flatMap((itm: AggregatedPayment) =>
        itm.payments.map((itm: PaymentEntity) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS
        }))
      );

    const inProgressDeposits: CashDepositEntity[] = afterMatch.deposits
      .filter((itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH)
      .map((itm: CashDepositEntity) => ({
        ...itm,
        status: MatchStatus.IN_PROGRESS
      }));

    const paymentsMatched: PaymentEntity[] =
      await this.paymentService.updatePayments(
        matchedPayments.flatMap((itm) =>
          itm.payments.map((payment) => ({
            ...payment,
            timestamp: payment.timestamp
          }))
        )
      );

    const updatedPaymentsInProgress: PaymentEntity[] =
      await this.paymentService.updatePayments(inProgressPayments);

    const updatedDepositsMatched: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(matchedDeposits);

    const updatedDepositsInProgress: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(inProgressDeposits);

    return {
      date: date,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      paymentsMatched: paymentsMatched.length,
      paymentsInProgress: updatedPaymentsInProgress.length,
      depositsMatched: updatedDepositsMatched.length,
      depositsInProgress: updatedDepositsInProgress.length
    };
  }
}
