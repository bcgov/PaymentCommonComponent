import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReconciliationEvent,
  CashReconciliationOutput,
  AggregatedPayment,
  GroupedPaymentsAndDeposits
} from './types';
import { ReconciliationType } from './types';
import { MatchStatus } from '../common/const';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(Logger) private appLogger: AppLogger,
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(TransactionService) private transactionService: TransactionService
  ) {}
  /**
   *
   * @param event
   * @returns PaymentEntity[]
   * @description Find all payments that are older than the past due date and mark as exceptions
   */
  public async findExceptions(
    event: ReconciliationEvent
  ): Promise<PaymentEntity[]> {
    /**
     *  @description Get Deposits by date range and location
     */
    const deposits: CashDepositEntity[] = await Promise.all(
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event
      )
    );
    const depositSummary: GroupedPaymentsAndDeposits[] =
      this.cashDepositService.aggregateDeposits(event, deposits);

    const paymentExceptions: PaymentEntity[] = [];

    /*
     * Map the deposits and find the third oldest deposit date
     * Then find all payments that are older than that date and set as exceptions
     */
    await Promise.all(
      depositSummary.map(async (summary, index) => {
        /**
         * check for the deposit date 3 indexes ahead (this is the past due date)
         */
        if (depositSummary[index + 3]) {
          const pastDuePaymentDate = depositSummary[index + 3].deposit_date;
          if (pastDuePaymentDate) {
            /**
             * Find all payments that are older than the past due date
             */
            const payments =
              await this.transactionService.findPaymentsExceptions(
                event,
                pastDuePaymentDate
              );
            /**
             * Update the status of the payments
             */
            payments.map(async (itm: PaymentEntity) =>
              paymentExceptions.push(
                await this.transactionService.updateCashPaymentStatus({
                  ...itm,
                  timestamp: itm.timestamp,
                  status: MatchStatus.EXCEPTION
                })
              )
            );
          }
        }
      })
    );
    /**
     * Return the payments marked as exceptions
     */
    return paymentExceptions;
  }

  /**
   * @param paymentsAndDeposits
   * @returns CashDepositPaymentPair
   * @description Second layer of heuristics to match payments and deposits by amount
   * Match payments and deposits by location and date
   */
  public allOrNoneMatchForPayments(
    paymentsAndDeposits: GroupedPaymentsAndDeposits
  ): GroupedPaymentsAndDeposits {
    /**
     * If none, return
     */
    if (
      !paymentsAndDeposits.aggregatedPayments ||
      !paymentsAndDeposits.deposits
    )
      return paymentsAndDeposits;
    /**
     * @description Check to see if the payment and deposit totals less than 0.5 apart - if yes, then consider a match
     */
    const differenceInSum = (amounts: number[]): number => {
      const sortedAmts = amounts.sort((a, b) => a - b);
      return sortedAmts[1] - sortedAmts[0];
    };
    const { aggregatedPayments: payments, deposits } = paymentsAndDeposits;
    /**
     * @description Loop through the payments and deposits and check for a match
     */
    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        // If we check this for the total payment sum by deposit date we will have better matches, but less  granularity
        if (differenceInSum([payment.amount, deposit.deposit_amt_cdn]) <= 0.5) {
          deposits[dindex].status = MatchStatus.MATCH;
          payments[pindex].status = MatchStatus.MATCH;
          const matchedPayments = payments[pindex].payments.map(
            (payment: PaymentEntity) => ({
              ...payment,
              timestamp: payment.timestamp,
              status: MatchStatus.MATCH,
              cash_deposit_match: deposits[dindex]
            })
          );
          /**
           * @description Update the status of the payments and deposits
           */
          payments[pindex].payments = matchedPayments;
          paymentsAndDeposits.status = MatchStatus.MATCH;
        }
      }
    }
    return paymentsAndDeposits;
  }
  /**
   * @param event
   * @returns GroupedPaymentsAndDeposits[]
   * @description First layer of heuristics is the database filtering by program, location, payment type, and date range
   * Find all payments and deposits  by location.
   * Group by deposit dates.
   * Aggregate the total amount of payments by deposit date.
   * Aggregate the deposit amounts by deposit date.
   */
  public async findCashPaymentsAndDeposits(
    event: ReconciliationEvent
  ): Promise<GroupedPaymentsAndDeposits[]> {
    const deposits: CashDepositEntity[] = await Promise.all(
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event
      )
    );
    if (deposits.length === 0) {
      this.appLogger.log(
        `No deposits found for ${event.fiscal_close_date} ${event.location.description}`,
        CashReconciliationService.name
      );
      return [];
    }
    this.appLogger.log(
      `Found ${deposits.length} deposits`,
      CashReconciliationService.name
    );
    /**
     * Aggregate the deposits by location and date, find the payments that match the deposit date
     */
    const cashDepositsAndPaymentsByLocation: GroupedPaymentsAndDeposits[] =
      this.cashDepositService.aggregateDeposits(event, deposits);
    /*
     * Map the deposits and find the payments less than the current deposit date
     */
    const paymentsAndDeposits = await Promise.all(
      cashDepositsAndPaymentsByLocation.map(
        async (summary: GroupedPaymentsAndDeposits, index: number) => {
          if (cashDepositsAndPaymentsByLocation[index + 1]) {
            const current = summary.deposit_date;
            const previous =
              cashDepositsAndPaymentsByLocation[index + 1].deposit_date;
            const aggregatedPayments: AggregatedPayment[] =
              await this.transactionService.findCashPayments(
                event,
                current,
                previous
              );

            return {
              ...summary,
              deposits,
              aggregatedPayments,
              payments_sum: aggregatedPayments.reduce((a, b) => a + b.amount, 0)
            };
          } else {
            return summary;
          }
        }
      )
    );
    if (paymentsAndDeposits.map((p) => p.aggregatedPayments).length === 0) {
      this.appLogger.log(
        `No payments found for ${event.fiscal_close_date} ${event.location.description}`,
        CashReconciliationService.name
      );
      return [];
    } else {
      return paymentsAndDeposits;
    }
  }
  /**
   * @param matches
   * @returns
   * @description Update the status of the matched payments and deposits
   */
  public async setMatchStatus(
    matches: GroupedPaymentsAndDeposits
  ): Promise<GroupedPaymentsAndDeposits> {
    matches.deposits.length > 0 &&
      (await Promise.all(
        matches.deposits.map(async (deposit) => {
          await this.cashDepositService.updateDepositStatus({
            ...deposit,
            status: MatchStatus.MATCH
          });
        })
      ));

    matches.aggregatedPayments.length > 0 &&
      (await Promise.all(
        matches.aggregatedPayments.map(
          async (aggregatedPayment: AggregatedPayment) =>
            aggregatedPayment.payments.map(
              async (payment: PaymentEntity) =>
                await this.transactionService.updatePaymentStatus({
                  ...payment,
                  timestamp: payment.timestamp,
                  status: MatchStatus.MATCH
                })
            )
        )
      ));

    return matches;
  }

  /**
   * @param inProgress
   * @returns
   * @description Update the status of the payments and deposits that are in progress
   */
  public async setInProgressStatus(
    inProgress: GroupedPaymentsAndDeposits
  ): Promise<GroupedPaymentsAndDeposits> {
    await Promise.all(
      inProgress.deposits.map(async (deposit) => {
        await this.cashDepositService.updateDepositStatus({
          ...deposit,
          status: MatchStatus.IN_PROGRESS
        });
      })
    );

    inProgress.aggregatedPayments.length > 0 &&
      (await Promise.all(
        inProgress.aggregatedPayments.map(
          async (aggregatedPayment: AggregatedPayment) =>
            aggregatedPayment.payments.map(
              async (payment: PaymentEntity) =>
                await this.transactionService.updatePaymentStatus({
                  ...payment,
                  timestamp: payment.timestamp,
                  status: MatchStatus.IN_PROGRESS
                })
            )
        )
      ));

    return inProgress;
  }
  /**
   * @param event
   * @returns CashReconciliationOutput
   */
  public async reconcile(
    event: ReconciliationEvent
  ): Promise<CashReconciliationOutput | unknown> {
    /**
     * Find all payments and deposits by location and date.
     */
    const paymentsAndDeposits: GroupedPaymentsAndDeposits[] =
      await this.findCashPaymentsAndDeposits(event);
    if (paymentsAndDeposits.length === 0) {
      return {
        message: 'No pending payments/deposits found'
      };
    }
    /**
     * Attempt matches
     */

    const matchAttempts = paymentsAndDeposits.map((itm) =>
      this.allOrNoneMatchForPayments(itm)
    );
    /**
     * Filter the matches and update the status of the deposits and payments
     */

    const matches = await Promise.all(
      matchAttempts
        .filter((itm) => itm.status === MatchStatus.MATCH)
        .map(async (itm) => await this.setMatchStatus(itm))
    );

    this.appLogger.log(
      `MATCHES: ${matches.length}`,
      CashReconciliationService.name
    );
    /**
     * Filter inProgress and update the status of the deposits and payments
     */
    const inProgress = await Promise.all(
      matchAttempts
        .filter((itm) => itm.status === MatchStatus.IN_PROGRESS)
        .map(async (itm) => await this.setInProgressStatus(itm))
    );

    this.appLogger.log(
      `IN_PROGRESS: ${inProgress.length}`,
      CashReconciliationService.name
    );
    /**
     * After updating the matches and exceptions during reconciliation, find the exceptions for the date range
     */
    const exceptions: PaymentEntity[] = await this.findExceptions(event);
    this.appLogger.log(
      `EXCEPTIONS: ${exceptions.length}`,
      CashReconciliationService.name
    );

    return {
      type: ReconciliationType.CASH,
      location: event.location.description,

      total_in_progress: inProgress.length,
      total_exceptions: exceptions.length,
      total_matches: matches.length
    };
  }
}
