import { Injectable, Inject, Logger } from '@nestjs/common';
import _ from 'underscore';
import {
  ReconciliationEvent,
  ReconciliationEventOutput,
  ReconciliationEventError,
  CashDepositDates,
  CashPaymentsCashDepositPair,
  AggregatedPayment,
  ReconciliationType
} from './types';
import { MatchStatus } from '../common/const';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}

  public markUnmatchedPaymentsAsInProgressOrExceptions(
    matches: CashPaymentsCashDepositPair[],
    aggregatedPayments: AggregatedPayment[],
    deposits: CashDepositEntity[],
    cashDepositDates: CashDepositDates
  ): {
    depositsMarkedInProgress: CashDepositEntity[];
    aggregatedPaymentsMarkedAsExceptionsOrInProgress: AggregatedPayment[];
  } {
    const depositsMarkedInProgress: CashDepositEntity[] = [];
    const aggregatedPaymentsMarkedAsExceptionsOrInProgress: AggregatedPayment[] =
      [];
    /**
     * look through the list of deposits, return an array of all the values that are not present in the matches array.
     */
    const depositsNotMatchedFromPendingDepositList = _.difference(
      deposits,
      matches.map((itm) => itm.deposit)
    );

    /**
     * look through the list of aggregatedPayments, return an array of all the values that are not present in the matches array.
     */
    const aggregatedPaymentsNotMatchedFromPendingPaymentList = _.difference(
      aggregatedPayments,
      matches.map((itm) => itm.payment)
    );

    /**
     * If the payment is older than the first deposit date, mark it as an exception.
     */

    for (const [
      pindex,
      payment
    ] of aggregatedPaymentsNotMatchedFromPendingPaymentList.entries()) {
      if (cashDepositDates.pastDue) {
        if (payment.fiscal_close_date < cashDepositDates.pastDue) {
          aggregatedPaymentsNotMatchedFromPendingPaymentList[pindex].status =
            MatchStatus.EXCEPTION;
          aggregatedPaymentsMarkedAsExceptionsOrInProgress.push(
            aggregatedPaymentsNotMatchedFromPendingPaymentList[pindex]
          );
          break;
        }
      } else {
        aggregatedPaymentsNotMatchedFromPendingPaymentList[pindex].status =
          MatchStatus.IN_PROGRESS;
        aggregatedPaymentsMarkedAsExceptionsOrInProgress.push(
          aggregatedPaymentsNotMatchedFromPendingPaymentList[pindex]
        );
        break;
      }
    }

    for (const [
      dindex,
      deposit
    ] of depositsNotMatchedFromPendingDepositList.entries()) {
      if (cashDepositDates.pastDue) {
        if (deposit.deposit_date < cashDepositDates.pastDue) {
          depositsNotMatchedFromPendingDepositList[dindex].status =
            MatchStatus.EXCEPTION;
          depositsMarkedInProgress.push(
            depositsNotMatchedFromPendingDepositList[dindex]
          );
          break;
        }
      } else {
        depositsNotMatchedFromPendingDepositList[dindex].status =
          MatchStatus.IN_PROGRESS;
        depositsMarkedInProgress.push(
          depositsNotMatchedFromPendingDepositList[dindex]
        );
        break;
      }
    }

    return {
      depositsMarkedInProgress,
      aggregatedPaymentsMarkedAsExceptionsOrInProgress
    };
  }

  public allOrNoneMatchForPayments(
    aggregatedPayments: AggregatedPayment[],
    deposits: CashDepositEntity[]
  ): CashPaymentsCashDepositPair[] {
    const matches: CashPaymentsCashDepositPair[] = [];

    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of aggregatedPayments.entries()) {
        if (
          _.isMatch(
            {
              //TODO@!!
              amount: parseFloat(payment.amount.toFixed(2)),
              status: MatchStatus.PENDING || MatchStatus.IN_PROGRESS
            },
            {
              //TODO@!!
              amount: parseFloat(deposit.deposit_amt_cdn.toFixed(2)),
              status: MatchStatus.PENDING || MatchStatus.IN_PROGRESS
            }
          )
        ) {
          aggregatedPayments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].deposit_id = deposit;
          deposits[dindex].payment_match = aggregatedPayments[pindex].payments;
          matches.push({
            payment: aggregatedPayments[pindex],
            deposit: deposits[dindex]
          });
          break;
        }
      }
    }

    return matches;
  }

  public async reconcile(
    event: ReconciliationEvent
  ): Promise<
    ReconciliationEventOutput | ReconciliationEventError | void | unknown
  > {
    const cashDepositDates = await this.cashDepositService.getDepositDateRange(
      event
    );

    if (
      (cashDepositDates && !cashDepositDates.current) ||
      !cashDepositDates.first
    ) {
      return {
        error: 'Skipping - No deposits found for this date range and location.'
      };
    }

    this.appLogger.log(
      `Querying for deposits between: ${cashDepositDates.first}-${cashDepositDates.current}`
    );
    const deposits =
      await this.cashDepositService.findCashDepositsByDepositDates(
        event,
        cashDepositDates
      );

    const pendingOrInProgressCashDeposits = deposits.filter(
      (itm: CashDepositEntity) =>
        itm.status === MatchStatus.PENDING ||
        itm.status === MatchStatus.IN_PROGRESS
    );

    this.appLogger.log(
      `Pending deposits: ${
        pendingOrInProgressCashDeposits.length || 0
      } SUM: ${pendingOrInProgressCashDeposits.reduce(
        (acc, itm) => (acc += itm.deposit_amt_cdn),
        0
      )}`
    );

    this.appLogger.log(
      `Querying for transactions/payments between: ${cashDepositDates.first}-${cashDepositDates.current}`
    );

    this.appLogger.log(
      `Any transactions which are not matched which occured prior to: ${cashDepositDates.pastDue} will be marked with an exception!`
    );
    this.appLogger.log(`Zero dollar payments will be ignored!`);
    const aggregatedPayments: AggregatedPayment[] =
      await this.transactionService.findCashPaymentsByDepositDates(
        event,
        cashDepositDates
      );

    const pendingOrInProgressAggregatedPayments = aggregatedPayments.filter(
      (itm: AggregatedPayment) =>
        itm.status === MatchStatus.PENDING ||
        itm.status === MatchStatus.IN_PROGRESS
    );

    this.appLogger.log(
      `Pending aggregated Payments: ${
        pendingOrInProgressAggregatedPayments.length || 0
      } SUM: ${pendingOrInProgressAggregatedPayments.reduce(
        (acc, itm) => (acc += itm.amount),
        0
      )}`
    );

    /**
     * Mark Payments and Deposits as In Progress or Exceptions
     */

    const matches = this.allOrNoneMatchForPayments(
      pendingOrInProgressAggregatedPayments,
      pendingOrInProgressCashDeposits
    );

    this.appLogger.log(`Found ${matches.length} matches`);
    const unmatched = this.markUnmatchedPaymentsAsInProgressOrExceptions(
      matches,
      aggregatedPayments,
      deposits,
      cashDepositDates
    );

    /**
     * Update Payments and Deposits
     */
    unmatched.aggregatedPaymentsMarkedAsExceptionsOrInProgress.map(
      async (payment: AggregatedPayment) =>
        await this.transactionService.updateCashPaymentStatus(payment)
    );

    unmatched.depositsMarkedInProgress.map(
      async (deposit: CashDepositEntity) =>
        await this.cashDepositService.updateDepositStatus(deposit)
    );

    matches.map(async (itm) => ({
      deposits: await this.cashDepositService.updateDepositStatus(itm.deposit),
      payments: await this.transactionService.markCashPaymentsAsMatched(
        itm.payment,
        itm.deposit
      )
    }));

    /**
     * Print Reconciliation Results
     */
    return {
      deposit_date: `${cashDepositDates.first}-${cashDepositDates.current}`,
      location_id: event.location_id,
      type: ReconciliationType.CASH,
      total_pending_payments: pendingOrInProgressAggregatedPayments.length,
      total_pending_deposits: pendingOrInProgressCashDeposits.length,
      payment_exceptions:
        unmatched.aggregatedPaymentsMarkedAsExceptionsOrInProgress.length,
      payments_matched: matches.filter((itm) => itm.payment).length,
      deposits_matched: matches.filter((itm) => itm.deposit).length,
      percent_matched:
        (matches.length /
          ((pendingOrInProgressAggregatedPayments.length +
            pendingOrInProgressCashDeposits.length) /
            2)) *
        100
    };
  }
}
