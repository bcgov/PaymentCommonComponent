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
   * @returns PaymentEntity[]
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async findExceptions(
    event: ReconciliationEvent
  ): Promise<PaymentEntity[] | void> {
    const dates = await this.cashDepositService.findPastDueDate(event);
    if (!dates?.pastDueDate || !dates?.currentDate) {
      this.appLogger.log(
        'No past due dates found',
        CashReconciliationService.name
      );
      return;
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
      await this.paymentService.findPaymentsExceptions(event, dates.pastDueDate)
    );
    if (payments.length === 0) {
      return;
    }
    const paymentExceptions = await this.paymentService.updatePayments(
      payments,
      MatchStatus.EXCEPTION
    );
    return await Promise.all(paymentExceptions);
  }

  public async getDatesForReconciliation(
    event: ReconciliationEvent
  ): Promise<string[]> {
    const dates = await this.cashDepositService.depositDates(event);
    return dates;
  }

  public matchPaymentsToDeposits(
    aggregatedPayments: AggregatedPayment[],
    deposits: CashDepositEntity[]
  ): {
    payments: PaymentEntity[];
    deposit: CashDepositEntity;
  }[] {
    const matches: {
      payments: PaymentEntity[];
      deposit: CashDepositEntity;
    }[] = [];

    const checkMatch = (
      payment: AggregatedPayment,
      deposit: CashDepositEntity
    ) => {
      if (Math.abs(deposit.deposit_amt_cdn - payment.amount) < 1) {
        this.appLogger.log(
          `MATCH: payment: ${payment.amount} --> deposit: ${deposit.deposit_amt_cdn}`,
          CashReconciliationService.name
        );
        matches.push({
          payments: payment.payments.map((payment) => ({
            ...payment,
            status: MatchStatus.MATCH,
            timestamp: payment.timestamp,
            cash_deposit_match: { ...deposit, status: MatchStatus.MATCH }
          })),
          deposit: { ...deposit, status: MatchStatus.MATCH }
        });
        return true;
      }
      return false;
    };

    deposits.forEach((deposit) =>
      aggregatedPayments.find((payment) => checkMatch(payment, deposit))
    );

    console.table(
      matches.map((itm) => ({
        payments_amount: itm.payments.reduce(
          (acc, itm) => (acc += itm.amount),
          0
        ),
        fiscal_close_date: new Set(
          itm.payments.map((itm) => itm.transaction.fiscal_close_date)
        ),
        deposit_id: itm.deposit.id,
        deposit_date: itm.deposit.deposit_date,
        deposit_amount: itm.deposit.deposit_amt_cdn
      }))
    );

    return matches;
  }

  public async getPaymentsAndDeposits(
    event: ReconciliationEvent,
    status: MatchStatus
  ): Promise<{ payments: PaymentEntity[]; deposits: CashDepositEntity[] }> {
    const payments = await this.paymentService.findCashPayments(event, status);

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        event,
        status
      );

    return {
      payments,
      deposits
    };
  }

  public async reconcileCash(
    event: ReconciliationEvent
  ): Promise<CashReconciliationOutput | unknown> {
    const pending = await this.getPaymentsAndDeposits(
      event,
      MatchStatus.PENDING
    );

    if (pending.deposits.length === 0 || pending.payments.length === 0) {
      return {
        message: 'No pending payments or deposits found'
      };
    }

    await Promise.all(
      await this.paymentService.updatePayments(
        pending.payments,
        MatchStatus.IN_PROGRESS
      )
    );
    await Promise.all(
      await this.cashDepositService.updateDeposits(
        pending.deposits,
        MatchStatus.IN_PROGRESS
      )
    );

    const inProgress = await this.getPaymentsAndDeposits(
      event,
      MatchStatus.IN_PROGRESS
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
      this.paymentService.aggregatePayments(inProgress.payments);
    this.appLogger.log(
      `-----------------------------------------------------`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `MATCHING: ${aggregatedPayments.length} AGGREGATED PAYMENTS to ${inProgress.deposits.length} DEPOSITS`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `-----------------------------------------------------`,
      CashReconciliationService.name
    );
    const matches = this.matchPaymentsToDeposits(
      aggregatedPayments,
      inProgress.deposits
    );

    this.appLogger.log(
      `TOTAL MATCHES: ${matches.length}`,
      CashReconciliationService.name
    );
    const matchedDeposits = matches.map((itm) => itm.deposit);
    const matchedPayments = matches.flatMap((itm) => itm.payments);

    await Promise.all(
      await this.paymentService.updatePayments(
        matchedPayments,
        MatchStatus.MATCH
      )
    );
    await Promise.all(
      await this.cashDepositService.updateDeposits(
        matchedDeposits,
        MatchStatus.MATCH
      )
    );

    return {
      date: event.date,
      type: ReconciliationType.CASH,
      location_id: event.location.location_id,
      total_inProgress_payments: inProgress.payments.length,
      total_inProgress_deposits: inProgress.deposits.length,
      total_matched_payments: matches.flatMap((itm) => itm.payments).length,
      total_matched_deposits: matches.map((itm) => itm.deposit).length
    };
  }
}
