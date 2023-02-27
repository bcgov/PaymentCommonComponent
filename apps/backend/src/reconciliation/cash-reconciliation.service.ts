import { Injectable, Inject, Logger } from '@nestjs/common';
import { ReconciliationEvent } from './types';
import { ReconciliationType, AggregatedPayment } from './types';
import { MatchStatus } from '../common/const';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { TransactionService } from '../transaction/transaction.service';
import { CashPaymentsCashDepositPair } from './../../dist/src/reconciliation/reconciliation.interfaces.d';
import { CashDepositEntity } from './../deposits/entities/cash-deposit.entity';

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
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async findExceptions(
    event: ReconciliationEvent,
    pastDueDate?: string | null
  ): Promise<PaymentEntity[]> {
    if (!pastDueDate) {
      return [];
    }

    const payments = await Promise.all(
      await this.transactionService.findPaymentsExceptions(event, pastDueDate)
    );

    const paymentExceptions = await Promise.all(
      payments.map(
        async (itm: PaymentEntity) =>
          await this.transactionService.updatePaymentStatus({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.EXCEPTION
          })
      )
    );

    return paymentExceptions;
  }

  public async getDatesForReconciliation(
    event: ReconciliationEvent
  ): Promise<string[]> {
    const dates = await this.cashDepositService.depositDates(event);
    return dates;
  }

  public matchPaymentsToDeposits(
    deposits: CashDepositEntity[],
    aggregatedPaymentsByFiscalCloseDate: AggregatedPayment[]
  ): {
    payments: PaymentEntity[];
    deposit: CashDepositEntity;
  }[][] {
    this.appLogger.log(
      `MATCHING ${aggregatedPaymentsByFiscalCloseDate.length} AGGREGATED PAYMENTS TO ${deposits.length} DEPOSITS`,
      CashReconciliationService.name
    );

    const matches = aggregatedPaymentsByFiscalCloseDate.map((payment) =>
      deposits.map((deposit) => {
        if (Math.abs(payment.amount - deposit.deposit_amt_cdn) < 1) {
          this.appLogger.log(
            `MATCH FOUND: ${payment.amount} - ${deposit.deposit_amt_cdn} `,
            CashReconciliationService.name
          );
        }
        return {
          payments: payment.payments.map((itm) => ({
            ...itm,
            status: MatchStatus.MATCH,
            timestamp: itm.timestamp,
            cash_deposit_match: deposit
          })),
          deposit
        };
      })
    );
    return matches;
  }

  public async reconcileCash(
    event: ReconciliationEvent
  ): Promise<{ message: string } | CashPaymentsCashDepositPair[] | unknown> {
    const pending = await this.getPending(event);
    await this.setPendingToInProgress(
      event,
      pending.deposits,
      pending.payments
    );
    const inProgress = await this.getInProgress(event);

    if (inProgress.deposits.length === 0) {
      this.appLogger.log(
        'NO IN PROGRESS DEPOSITS FOUND',
        CashReconciliationService.name
      );
      return {
        message: 'No InProgress Deposits Found'
      };
    }

    if (inProgress.payments.length === 0) {
      this.appLogger.log(
        'NO IN PRORGESS PAYMENTS FOUND',
        CashReconciliationService.name
      );
      return {
        message: 'No InProgress Payments Found'
      };
    }

    const aggregatedPaymentsByFiscalCloseDate =
      this.transactionService.aggregatePayments(inProgress.payments);

    const matches = this.matchPaymentsToDeposits(
      inProgress.deposits,
      aggregatedPaymentsByFiscalCloseDate
    );

    const updateMatches = await Promise.all(
      matches.map(
        async (itm) =>
          await Promise.all(
            itm.map(
              async (item) => await this.setMatches(item.deposit, item.payments)
            )
          )
      )
    );
    const setToMatchedPayments = updateMatches
      .map((itm) => itm.map((item) => item.payments))
      .flat().length;
    const setToMatchedDeposits = updateMatches
      .map((itm) => itm.map((item) => item.deposit))
      .flat().length;
    this.appLogger.log(`Updated ${setToMatchedPayments} Payments To Matched`);
    this.appLogger.log(`Updated ${setToMatchedDeposits} Deposits To Matched`);

    return {
      fiscal_close_date: event.date,
      type: ReconciliationType.CASH,
      location_id: event.location.location_id,
      total_pending: pending.payments.length + pending.deposits.length,
      total_matched_payments: setToMatchedPayments,
      total_matched_deposits: setToMatchedDeposits,
      total_exceptions: 0,
      percent_matched: parseFloat(
        (
          ((setToMatchedDeposits + setToMatchedPayments) /
            (inProgress.payments.length + inProgress.deposits.length)) *
          100
        ).toFixed(2)
      )
    };
  }

  public async getInProgress(
    event: ReconciliationEvent
  ): Promise<{ payments: PaymentEntity[]; deposits: CashDepositEntity[] }> {
    const inProgressDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event,
        MatchStatus.IN_PROGRESS
      );

    this.appLogger.log(
      `FOUND: ${inProgressDeposits.length} DEPOSITS IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );

    const inProgressPayments = await this.transactionService.findCashPayments(
      event,
      MatchStatus.IN_PROGRESS
    );

    this.appLogger.log(
      `FOUND: ${inProgressPayments.length} PAYMENTS IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );

    return {
      deposits: inProgressDeposits,
      payments: inProgressPayments
    };
  }

  public async setMatches(
    deposit: CashDepositEntity,
    payments: PaymentEntity[]
  ): Promise<{ payments: PaymentEntity[]; deposit: CashDepositEntity }> {
    const matchedPayments = await Promise.all(
      payments.map(
        async (payment) =>
          await this.transactionService.updatePaymentStatus({
            ...payment,
            cash_deposit_match: deposit,
            timestamp: payment.timestamp,
            status: MatchStatus.MATCH
          })
      )
    );

    const matchedDeposit = await this.cashDepositService.updateDepositStatus({
      ...deposit,
      status: MatchStatus.MATCH
    });

    return {
      deposit: matchedDeposit,
      payments: matchedPayments
    };
  }
  public async getPending(
    event: ReconciliationEvent
  ): Promise<{ payments: PaymentEntity[]; deposits: CashDepositEntity[] }> {
    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event,
        MatchStatus.PENDING
      );

    const pendingPayments: PaymentEntity[] =
      await this.transactionService.findCashPayments(
        event,
        MatchStatus.PENDING
      );
    return {
      deposits: pendingDeposits,
      payments: pendingPayments
    };
  }
  public async setPendingToInProgress(
    event: ReconciliationEvent,
    deposits: CashDepositEntity[],
    payments: PaymentEntity[]
  ): Promise<{ payments: PaymentEntity[]; deposits: CashDepositEntity[] }> {
    this.appLogger.log(
      `GET PENDING FOR: ${event.date}`,
      CashReconciliationService.name
    );

    this.appLogger.log(
      `PAYMENTS: ${payments.length} PENDING --> IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `DEPOSITS: ${deposits.length} PENDING --> IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );

    const pendingPayments = await Promise.all(
      payments.map(
        async (payment) =>
          await this.transactionService.updatePaymentStatus({
            ...payment,
            timestamp: payment.timestamp,
            status: MatchStatus.IN_PROGRESS
          })
      )
    );
    const pendingDeposits = await Promise.all(
      deposits.map(
        async (itm: CashDepositEntity) =>
          await this.cashDepositService.updateDepositStatus({
            ...itm,
            status: MatchStatus.IN_PROGRESS
          })
      )
    );
    return {
      payments: pendingPayments,
      deposits: pendingDeposits
    };
  }
}
