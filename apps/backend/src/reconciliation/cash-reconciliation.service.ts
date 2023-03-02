import { Injectable, Inject, Logger } from '@nestjs/common';
import { ReconciliationEvent } from './types';
import {
  ReconciliationType,
  AggregatedPayment,
  CashReconciliationOutput
} from './types';
import { MatchStatus } from '../common/const';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { TransactionService } from '../transaction/transaction.service';
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
    event: ReconciliationEvent
  ): Promise<PaymentEntity[]> {
    const dates = await this.cashDepositService.findPastDueDate(event);
    if (!dates?.pastDueDate || !dates?.currentDate) {
      this.appLogger.log(
        'No past due dates found',
        CashReconciliationService.name
      );
      return [];
    }
    this.appLogger.log(
      `CURRENT DATE: ${dates.currentDate}`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `PAST DUE DATE: ${dates.pastDueDate}`,
      CashReconciliationService.name
    );

    const payments = await Promise.all(
      await this.transactionService.findPaymentsExceptions(
        event,
        dates.pastDueDate
      )
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
    payments: AggregatedPayment[]
  ): {
    payments: PaymentEntity[];
    deposit: CashDepositEntity;
  }[] {
    this.appLogger.log(
      `MATCHING ${payments.length} AGGREGATED PAYMENTS TO ${deposits.length} DEPOSITS`,
      CashReconciliationService.name
    );

    const matches: {
      payments: PaymentEntity[];
      deposit: CashDepositEntity;
    }[] = [];

    const checkMatch = (
      payment: AggregatedPayment,
      deposit: CashDepositEntity
    ) => {
      this.appLogger.log(
        `MATCH? ${payment.amount} vs ${deposit.deposit_amt_cdn}`
      );
      if (Math.abs(deposit.deposit_amt_cdn - payment.amount) < 1) {
        this.appLogger.log(`MATCH FOUND:`, CashReconciliationService.name);
        this.appLogger.log(
          `DEPOSIT: amount: $${deposit.deposit_amt_cdn} date: ${deposit.deposit_date}`,
          CashReconciliationService.name
        );
        this.appLogger.log(
          `PAYMENT: amount: $${payment.amount} date: ${payment.fiscal_close_date} `,
          CashReconciliationService.name
        );

        const payments: PaymentEntity[] = payment.payments.map((itm) => ({
          ...itm,
          status: MatchStatus.MATCH,
          timestamp: itm.timestamp,
          cash_deposit_match: { ...deposit, status: MatchStatus.MATCH }
        }));

        const depositMatch: CashDepositEntity = {
          ...deposit,
          status: MatchStatus.MATCH
        };
        //TODO [CCFPCM-406] - set matched as match - Loop through unmatched with broader match criteria
        matches.push({ payments, deposit: depositMatch });
        return { match: { payments, deposit: depositMatch } };
      }
      //TODO [CCFPCM-406] Loop through unmatched again with broader match criteria
      return { payment, deposit };
    };
    /**
     * Loop through all deposits and payments and check for a match
     */
    deposits.map((deposit) =>
      payments.map((payment) => checkMatch(payment, deposit))
    );
    /*
     * Return the matches pushed into matches array - TODO [CCFPCM-404]- return unmatched and repeat match process with broader criteria
     */
    return matches;
  }

  public async reconcileCash(
    event: ReconciliationEvent
  ): Promise<CashReconciliationOutput | unknown> {
    const pending = await this.getPending(event);
    this.appLogger.log(
      `PENDING DEPOSITS: ${pending.deposits.length}`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `PENDING PAYMENTS: ${pending.payments.length}`,
      CashReconciliationService.name
    );

    await this.setPendingToInProgress(
      event,
      pending.deposits,
      pending.payments
    );

    const inProgress = await this.getInProgress(event);
    this.appLogger.log(
      `FOUND: ${inProgress.deposits.length} DEPOSITS IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );

    this.appLogger.log(
      `FOUND: ${inProgress.payments.length} PAYMENTS IN PROGRESS for ${event.date}`,
      CashReconciliationService.name
    );

    if (inProgress.deposits.length === 0) {
      this.appLogger.log(
        'NO IN PROGRESS DEPOSITS FOUND',
        CashReconciliationService.name
      );
      return;
    }

    if (inProgress.payments.length === 0) {
      this.appLogger.log(
        'NO IN PROGRESS PAYMENTS FOUND',
        CashReconciliationService.name
      );
      return;
    }

    const aggregatedPayments: AggregatedPayment[] =
      this.transactionService.aggregatePayments(inProgress.payments);

    inProgress.deposits.map((itm) =>
      this.appLogger.log(
        `Deposit: date: ${itm.deposit_date} amount: ${itm.deposit_amt_cdn} status: ${itm.status}`,
        CashReconciliationService.name
      )
    );
    aggregatedPayments.map((itm) =>
      this.appLogger.log(
        `Aggregated Payment: date: ${itm.fiscal_close_date} amount: ${itm.amount} number of payments: ${itm.payments.length} status: ${itm.status}`,
        CashReconciliationService.name
      )
    );

    const matches = this.matchPaymentsToDeposits(
      inProgress.deposits,
      aggregatedPayments
    );

    const updateMatches: {
      payments: PaymentEntity[];
      deposit: CashDepositEntity;
    }[] = await Promise.all(
      matches.map(
        async (match) => await this.setMatches(match.deposit, match.payments)
      )
    );
    const setToMatchedPayments = updateMatches
      .map((itm) => itm.payments)
      .flat().length;

    const setToMatchedDeposits = updateMatches.map((itm) => itm.deposit).length;

    this.appLogger.log(`Updated ${setToMatchedPayments} Payments To Matched`);
    this.appLogger.log(`Updated ${setToMatchedDeposits} Deposits To Matched`);

    return {
      date: event.date,
      type: ReconciliationType.CASH,
      location_id: event.location.location_id,
      total_inProgress_payments: inProgress.payments.length,
      total_inProgress_deposits: inProgress.deposits.length,
      total_matched_payments: setToMatchedPayments,
      total_matched_deposits: setToMatchedDeposits,
      percent_matched_payments: parseFloat(
        ((setToMatchedPayments / inProgress.payments.length) * 100).toFixed(2)
      ),
      percent_matched_deposits: parseFloat(
        ((setToMatchedDeposits / inProgress.deposits.length) * 100).toFixed(2)
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

    const inProgressPayments = await this.transactionService.findCashPayments(
      event,
      MatchStatus.IN_PROGRESS
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
          await this.transactionService.updatePaymentStatus(payment)
      )
    );

    const matchedDeposit = await this.cashDepositService.updateDepositStatus(
      deposit
    );

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
