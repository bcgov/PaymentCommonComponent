import { Injectable, Inject, Logger } from '@nestjs/common';
import { ReconciliationType, AggregatedPayment } from './types';
import { MatchStatus } from '../common/const';
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
   * @param event
   * @returns
   * @description Find all deposit dates for a given location and program
   */
  public async findCashDepositDatesByLocation(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<string[]> {
    this.appLogger.log({ dateRange }, CashReconciliationService.name);

    return await this.cashDepositService.findCashDepositDatesByLocation(
      program,
      dateRange,
      location
    );
  }

  public checkStatus(
    payment: AggregatedPayment,
    deposit: CashDepositEntity
  ): boolean {
    if (
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
    ) {
      return true;
    }
    return false;
  }

  public checkPaymentCashMatch(payment: AggregatedPayment): boolean {
    return payment.payments.every(
      ({ cash_deposit_match }) => cash_deposit_match === undefined
    );
  }

  public checkAggregatedPaymentAmountToCashDepositAmount(
    payment: AggregatedPayment,
    deposit: CashDepositEntity
  ) {
    return Math.abs(deposit.deposit_amt_cdn - payment.amount) < 0.001;
  }

  public checkMatch(
    payment: AggregatedPayment,
    deposit: CashDepositEntity
  ): boolean {
    return (
      this.checkStatus(payment, deposit) &&
      this.checkPaymentCashMatch(payment) &&
      this.checkAggregatedPaymentAmountToCashDepositAmount(payment, deposit)
    );
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
        if (this.checkMatch(payment, deposit)) {
          this.appLogger.log(
            `MATCHED PAYMENT: ${payment.amount} TO DEPOSIT: ${deposit.deposit_amt_cdn}`,
            CashReconciliationService.name
          );
          deposits[dindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].payments = payment.payments.map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.MATCH,
            cash_deposit_match: deposits[dindex]
          }));
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
    dateRange: DateRange
  ): Promise<unknown> {
    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDate(
        program,
        dateRange.to_date,
        location,
        [MatchStatus.IN_PROGRESS, MatchStatus.PENDING]
      );

    const aggregatedPayments: AggregatedPayment[] =
      await this.paymentService.getAggregatedPaymentsByCashDepositDates(
        dateRange,
        location
      );
    this.appLogger.log(
      `${aggregatedPayments?.length} AGGREGATED PAYMENTS PENDING RECONCILIATION`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${pendingDeposits?.length} DEPOSITS PENDING RECONCILIATION`,
      CashReconciliationService.name
    );
    if (pendingDeposits.length === 0 && aggregatedPayments.length === 0) {
      this.appLogger.log(
        'No pending payments / deposits found',
        CashReconciliationService.name
      );
      return;
    }

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
    this.appLogger.log(
      `${matchedPayments.length} PAYMENTS MARKED MATCHED`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${matchedDeposits.length} DEPOSITS MARKED MATCHED`,
      CashReconciliationService.name
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

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(inProgressPayments).length
      } PAYMENTS MARKED IN_PROGRESS`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${inProgressDeposits.length} DEPOSITS MARKED IN_PROGRESS`,
      CashReconciliationService.name
    );

    const paymentsMatched: PaymentEntity[] =
      await this.paymentService.updatePayments(
        matchedPayments.flatMap((itm) =>
          itm.payments.map((payment) => ({
            ...payment,
            timestamp: payment.timestamp
          }))
        )
      );

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(paymentsMatched).length
      } PAYMENTS UPDATED AS MATCH`,
      CashReconciliationService.name
    );
    const updatedPaymentsInProgress: PaymentEntity[] =
      await this.paymentService.updatePayments(inProgressPayments);
    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(updatedPaymentsInProgress).length
      } PAYMENTS UPDATED AS IN_PROGRESS`,
      CashReconciliationService.name
    );

    const updatedDepositsMatched: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(matchedDeposits);
    this.appLogger.log(
      `${updatedDepositsMatched.length} DEPOSITS UPDATED TO MATCH`,
      CashReconciliationService.name
    );
    const updatedDepositsInProgress: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(inProgressDeposits);

    this.appLogger.log(
      `${updatedDepositsInProgress.length} DEPOSITS UPDATED TO IN_PROGRESS`,
      CashReconciliationService.name
    );

    return {
      dateRange,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      pendingPayments: aggregatedPayments.length,
      pendingDeposits: pendingDeposits.length,
      paymentsMatched:
        this.paymentService.aggregatePayments(paymentsMatched).length,
      paymentsInProgress: this.paymentService.aggregatePayments(
        updatedPaymentsInProgress
      ).length,
      depositsMatched: updatedDepositsMatched.length,
      depositsInProgress: updatedDepositsInProgress.length
    };
  }
}
