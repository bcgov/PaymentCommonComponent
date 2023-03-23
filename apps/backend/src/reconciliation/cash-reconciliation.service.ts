import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReconciliationType,
  AggregatedPayment,
  CashReconciliationOutput
} from './types';
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
   */
  public async getDatesForReconciliation(
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
    payments: PaymentEntity[];
    deposits: CashDepositEntity[];
  } | void> {
    const dateRange = { to_date: date, from_date: '2023-01-01' };
    const depositDates = await this.cashDepositService.findDistinctDepositDates(
      program,
      dateRange,
      location
    );
    const dates = {
      currentDate: depositDates[0],
      pastDueDate: depositDates[2]
    };

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
      await this.paymentService.findPaymentsExceptions(
        location,
        dates.pastDueDate
      )
    );
    const deposits = await Promise.all(
      await this.cashDepositService.findExceptions(
        dates.pastDueDate,
        program,
        location
      )
    );
    if (payments.length === 0) {
      return;
    }
    const paymentExceptions = await Promise.all(
      await this.paymentService.updatePayments(payments, MatchStatus.EXCEPTION)
    );
    const depositExceptions = await Promise.all(
      await this.cashDepositService.updateDeposits(
        deposits,
        MatchStatus.EXCEPTION
      )
    );

    return { payments: paymentExceptions, deposits: depositExceptions };
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
      if (Math.abs(deposit.deposit_amt_cdn - payment.amount) < 0.01) {
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
    this.appLogger.log(`MATCHES:`, CashReconciliationService.name);
    console.table(
      matches.map((itm) => ({
        payments_amount: itm.payments.reduce(
          (acc, itm) => (acc += itm.amount),
          0
        ),
        fiscal_close_date: Array.from(
          new Set(itm.payments.map((itm) => itm.transaction.fiscal_close_date))
        )[0],
        deposit_id: itm.deposit.id,
        status: itm.deposit.status,
        deposit_date: itm.deposit.deposit_date,
        deposit_amount: itm.deposit.deposit_amt_cdn
      }))
    );
    this.appLogger.log(`UNMATCHED PAYMENTS:`, CashReconciliationService.name);
    console.table(
      aggregatedPayments
        .filter(
          (itm) =>
            !matches.find((match) =>
              match.payments.find((pay) => pay.id === itm.payments[0].id)
            )
        )
        .map((itm) => ({
          payments_amount: itm.payments.reduce(
            (acc, itm) => (acc += itm.amount),
            0
          ),
          status: itm.payments[0].status,
          fiscal_close_date: Array.from(
            new Set(
              itm.payments.map((itm) => itm.transaction.fiscal_close_date)
            )
          )[0]
        }))
    );
    this.appLogger.log(`UNMATCHED DEPOSITS:`, CashReconciliationService.name);
    console.table(
      deposits
        .filter((itm) => !matches.find((match) => match.deposit.id === itm.id))
        .map((deposit) => ({
          deposit_id: deposit.id,
          status: deposit.status,
          deposit_date: deposit.deposit_date,
          deposit_amount: deposit.deposit_amt_cdn
        }))
    );

    return matches;
  }

  /**
   *
   * @param program
   * @param currentDate
   * @param pastDueDate
   * @param location
   * @param status
   * @returns
   */
  public async getPaymentsAndDeposits(
    program: Ministries,
    currentDate: string,
    pastDueDate: string,
    location: LocationEntity,
    status: MatchStatus
  ): Promise<{
    payments: PaymentEntity[];
    deposits: CashDepositEntity[];
  }> {
    const payments = await this.paymentService.findCashPayments(
      currentDate,
      pastDueDate,
      location,
      status
    );

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        program,
        currentDate,
        location,
        status
      );

    return {
      payments,
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
    const dateRange = { to_date: date, from_date: '2023-01-01' };

    const depositDates = await this.cashDepositService.findDistinctDepositDates(
      program,
      dateRange,
      location
    );

    const dates = {
      currentDate: depositDates[0],
      pastDueDate: depositDates[2]
    };

    if (!dates?.pastDueDate || !dates?.currentDate) {
      this.appLogger.log(
        'No previous or current dates found. Skipping...',
        CashReconciliationService.name
      );
      return;
    }

    this.appLogger.log(
      `CURRENT DATE: ${dates.currentDate}`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `PREVIOUS (2) DEPOSIT DATES: ${dates.pastDueDate}`,
      CashReconciliationService.name
    );

    const pending = await this.getPaymentsAndDeposits(
      program,
      dates.currentDate,
      dates.pastDueDate,
      location,
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
      program,
      dates.currentDate,
      dates.pastDueDate,
      location,
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
      date: date,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      total_inProgress_payments: inProgress.payments.length,
      total_inProgress_deposits: inProgress.deposits.length,
      total_matched_payments: matches.flatMap((itm) => itm.payments).length,
      total_matched_deposits: matches.map((itm) => itm.deposit).length
    };
  }
}
