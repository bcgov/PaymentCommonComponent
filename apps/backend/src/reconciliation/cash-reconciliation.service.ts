import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReconciliationEvent,
  CashReconciliationOutput,
  AggregatedPayment
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
  public async findPaymentExceptions(
    event: ReconciliationEvent,
    depositDates: string[]
  ): Promise<PaymentEntity[]> {
    /**
     *  @description Get Deposits by date range and location
     */
    const pastDueDepositDate = depositDates[0];
    const exceptions = await Promise.all(
      await this.transactionService.findPaymentsExceptions(
        event,
        pastDueDepositDate
      )
    );

    return await Promise.all(
      exceptions.map(
        async (itm: PaymentEntity) =>
          await this.transactionService.updateCashPaymentStatus({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.EXCEPTION
          })
      )
    );
  }

  /**
   * @param paymentsAndDeposits
   * @returns CashDepositPaymentPair
   * @description Second layer of heuristics to match payments and deposits by amount
   * Match payments and deposits by location and date
   */
  public allOrNoneMatchForPayments(
    payments: AggregatedPayment[],
    deposits: CashDepositEntity[]
  ): { payments: AggregatedPayment[]; deposits: CashDepositEntity[] } {
    const differenceInSum = (num1: number, num2: number): number => {
      const sum = Math.abs(num1 - num2);
      return sum;
    };

    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of payments.entries()) {
        if (
          deposit.status !== MatchStatus.MATCH &&
          payment.status !== MatchStatus.MATCH
        ) {
          if (differenceInSum(payment.amount, deposit.deposit_amt_cdn) <= 0.5) {
            deposits[dindex].status = MatchStatus.MATCH;
            payments[pindex].status = MatchStatus.MATCH;
            payments[pindex].payments = payment.payments.map((payment) => ({
              ...payment,
              timestamp: payment.timestamp,
              status: MatchStatus.MATCH,
              cash_deposit_match: deposits[dindex]
            }));

            break;
          }
        }
      }
    }

    return {
      payments,
      deposits
    };
  }

  async updateDepositsStatus(deposits: CashDepositEntity[]): Promise<{
    matched: CashDepositEntity[];
    inProgress: CashDepositEntity[];
  }> {
    const depositMatches = deposits.filter(
      (itm: CashDepositEntity) => itm.status === MatchStatus.MATCH
    );
    const inProgressDeposits = deposits.filter(
      (itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH
    );

    const matched = await Promise.all(
      depositMatches.map(
        async (itm) => await this.cashDepositService.updateDepositStatus(itm)
      )
    );

    const inProgress = await Promise.all(
      inProgressDeposits.map((itm) =>
        this.cashDepositService.updateDepositStatus({
          ...itm,
          status: MatchStatus.IN_PROGRESS
        })
      )
    );
    return {
      matched,
      inProgress
    };
  }

  async updatePaymentsStatus(payments: AggregatedPayment[]): Promise<{
    matched: PaymentEntity[];
    inProgress: PaymentEntity[];
  }> {
    const paymentMatches = payments.filter(
      (itm: AggregatedPayment) => itm.status === MatchStatus.MATCH
    );

    const inProgressPayments = payments.filter(
      (itm: AggregatedPayment) => itm.status !== MatchStatus.MATCH
    );

    const matched: PaymentEntity[] = [];
    await Promise.all(
      paymentMatches.map((itm) =>
        itm.payments.map(async (payment) =>
          matched.push(
            await this.transactionService.updateCashPaymentStatus(payment)
          )
        )
      )
    );
    const inProgress: PaymentEntity[] = [];

    await Promise.all(
      inProgressPayments.map((itm: AggregatedPayment) =>
        itm.payments.map(async (payment: PaymentEntity) =>
          inProgress.push(
            await this.transactionService.updateCashPaymentStatus({
              ...payment,
              timestamp: payment.timestamp,
              status: MatchStatus.IN_PROGRESS
            })
          )
        )
      )
    );
    return {
      matched,
      inProgress
    };
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
    event: ReconciliationEvent,
    depositDates: string[]
  ): Promise<{ payments: AggregatedPayment[]; deposits: CashDepositEntity[] }> {
    const deposits: CashDepositEntity[] = await Promise.all(
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event
      )
    );

    this.appLogger.log(
      `Found ${deposits.length} deposits`,
      CashReconciliationService.name
    );

    const payments = await this.transactionService.findCashPayments(
      event,
      depositDates
    );
    this.appLogger.log(
      `Found ${payments.length} aggregated payments - total: ${
        payments.map((itm) => itm.payments).flat().length
      } payments`,
      CashReconciliationService.name
    );

    return {
      deposits,
      payments
    };
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

    const depositDates = await this.cashDepositService.getCashDepositDates(
      event
    );

    const {
      payments: pendingOrInProgressPayments,
      deposits: pendingOrInProgressDeposits
    } = await this.findCashPaymentsAndDeposits(event, depositDates);

    if (
      pendingOrInProgressDeposits.length === 0 ||
      pendingOrInProgressPayments.length === 0
    ) {
      this.appLogger.log(
        `No deposits found for ${event.fiscal_close_date} ${event.location.description}`,
        CashReconciliationService.name
      );
      return [];
    }

    const {
      payments: inProgressOrMatchedPayments,
      deposits: inProgressOrMatchedDeposits
    } = this.allOrNoneMatchForPayments(
      pendingOrInProgressPayments,
      pendingOrInProgressDeposits
    );

    const { matched: matchedDeposits, inProgress: inProgressDeposits } =
      await this.updateDepositsStatus(inProgressOrMatchedDeposits);

    const { matched: matchedPayments, inProgress: inProgressPayments } =
      await this.updatePaymentsStatus(inProgressOrMatchedPayments);

    const exceptions = await this.findPaymentExceptions(event, depositDates);

    this.appLogger.log(`Matched ${matchedPayments.length} payments`);
    this.appLogger.log(`Matched ${matchedDeposits.length} deposits`);
    this.appLogger.log(`In Progress ${inProgressPayments.length} payments`);
    this.appLogger.log(`In Progress ${inProgressDeposits.length} deposits`);
    this.appLogger.log(`Found ${exceptions.length} exceptions`);

    return {
      type: ReconciliationType.CASH,
      location: event.location.description,
      deposits_in_progress: inProgressDeposits.length,
      deposits_matched: matchedDeposits.length,
      payments_in_progress: inProgressPayments.length,
      payments_matched: matchedPayments.length,
      exceptions: exceptions.length
    };
  }
}
