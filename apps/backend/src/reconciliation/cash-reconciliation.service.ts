import { Injectable, Inject } from '@nestjs/common';
import { parse } from 'date-fns';
import Decimal from 'decimal.js';
import { FindOptionsOrderValue } from 'typeorm';
import { ReconciliationType, AggregatedCashPayment } from './types';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { LocationEntity } from '../location/entities';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

@Injectable()
export class CashReconciliationService {
  constructor(
    @Inject(CashDepositService) private cashDepositService: CashDepositService,
    @Inject(PaymentService) private paymentService: PaymentService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(CashReconciliationService.name);
  }
  /**
   *
   * @param event
   * @returns PaymentEntity[]
   * @description Find all payments and deposits that are older than the past due date and mark as exceptions
   */

  public async setExceptions(
    location: LocationEntity,
    program: Ministries,
    exceptionsDate: string,
    currentDate: Date
  ): Promise<{ payments: number; deposits: number }> {
    const payments: PaymentEntity[] =
      await this.paymentService.findPaymentsExceptions(
        location.location_id,
        exceptionsDate
      );

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositExceptions(
        exceptionsDate,
        program
        // location
      );

    const paymentExceptions: PaymentEntity[] =
      await this.paymentService.updatePayments(
        payments.map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.EXCEPTION,
          reconciled_on: currentDate,
        }))
      );

    const depositExceptions: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(
        deposits.map((itm) => ({
          ...itm,
          status: MatchStatus.EXCEPTION,
          reconciled_on: currentDate,
        }))
      );

    return {
      payments: paymentExceptions?.length ?? 0,
      deposits: depositExceptions?.length ?? 0,
    };
  }

  public async reconcileCashByLocation(
    location: LocationEntity,
    program: Ministries,
    dateRange: DateRange
  ) {
    const order: FindOptionsOrderValue = 'ASC';

    const allCashDepositDatesPerLocation =
      await this.cashDepositService.findAllCashDepositDatesPerLocation(
        program,
        location,
        order
      );

    const filtered = allCashDepositDatesPerLocation.filter(
      (date: string) =>
        parse(date, 'yyyy-MM-dd', new Date()) >=
          parse(dateRange.minDate, 'yyyy-MM-dd', new Date()) &&
        parse(date, 'yyyy-MM-dd', new Date()) <=
          parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
    );
    this.appLogger.log(
      `Reconciliation Cash: ${location.description} - ${location.location_id}`,
      CashReconciliationService.name
    );
    for (const date of filtered) {
      const currentCashDepositDate = date;
      const previousCashDepositDate =
        filtered[filtered.indexOf(date) - 2] ?? dateRange.minDate;

      const cashDepositDateRange = {
        minDate: previousCashDepositDate,
        maxDate: currentCashDepositDate,
      };

      await this.reconcileCash(
        location,
        program,
        cashDepositDateRange,
        parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
      );

      await this.setExceptions(
        location,
        program,
        previousCashDepositDate,
        parse(dateRange.maxDate, 'yyyy-MM-dd', new Date())
      );
    }
  }

  public checkStatus(
    payment: AggregatedCashPayment,
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

  public checkPaymentCashMatch(payment: AggregatedCashPayment): boolean {
    return payment.payments.every(
      (p: PaymentEntity) => p.cash_deposit_match === undefined
    );
  }

  public checkAggregatedCashPaymentAmountToCashDepositAmount(
    payment: AggregatedCashPayment,
    deposit: CashDepositEntity
  ) {
    return (
      new Decimal(deposit.deposit_amt_cdn).toNumber() ===
      new Decimal(payment.amount).toNumber()
    );
  }

  public checkMatch(
    payment: AggregatedCashPayment,
    deposit: CashDepositEntity
  ): boolean {
    return (
      this.checkStatus(payment, deposit) &&
      this.checkPaymentCashMatch(payment) &&
      this.checkAggregatedCashPaymentAmountToCashDepositAmount(payment, deposit)
    );
  }

  /**
   *
   * @param aggregatedCashPayments
   * @param deposits
   * @returns
   */

  public matchPaymentsToDeposits(
    aggregatedCashPayments: AggregatedCashPayment[],
    deposits: CashDepositEntity[]
  ): {
    aggregatedCashPayment: AggregatedCashPayment;
    deposit: CashDepositEntity;
  }[] {
    const matches: {
      aggregatedCashPayment: AggregatedCashPayment;
      deposit: CashDepositEntity;
    }[] = [];

    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of aggregatedCashPayments.entries()) {
        if (this.checkMatch(payment, deposit)) {
          aggregatedCashPayments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          matches.push({
            aggregatedCashPayment: {
              ...payment,
              status: MatchStatus.MATCH,
              payments: payment.payments.map((itm) => ({
                ...itm,
                timestamp: itm.timestamp,
                status: MatchStatus.MATCH,
                cash_deposit_match: { ...deposit, status: MatchStatus.MATCH },
              })),
            },
            deposit: { ...deposit, status: MatchStatus.MATCH },
          });
          break;
        }
      }
    }
    return matches;
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
    dateRange: DateRange,
    currentDate: Date
  ): Promise<unknown> {
    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDate(
        program,
        dateRange.maxDate,
        location,
        [MatchStatus.IN_PROGRESS, MatchStatus.PENDING]
      );

    const aggregatedCashPayments: AggregatedCashPayment[] =
      await this.paymentService.getAggregatedCashPaymentsByCashDepositDates(
        dateRange,
        location.location_id
      );
    if (pendingDeposits.length === 0 || aggregatedCashPayments.length === 0) {
      this.appLogger.log('SKIPPING - No pending payments / deposits found');
      return;
    }

    const matches = this.matchPaymentsToDeposits(
      aggregatedCashPayments.filter((itm) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(itm.status)
      ),
      pendingDeposits.filter((itm) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(itm.status)
      )
    );

    const matchedPayments: PaymentEntity[] = matches
      .map((itm) => itm.aggregatedCashPayment)
      .flatMap((itm) =>
        itm.payments.map((pmnt) => ({
          ...pmnt,
          reconciled_on: currentDate,
          timestamp: pmnt.timestamp,
        }))
      );

    const matchedDeposits: CashDepositEntity[] = matches.map((itm) => ({
      ...itm.deposit,
      reconciled_on: currentDate,
    }));

    this.appLogger.log(`${matchedPayments.length} PAYMENTS MARKED MATCHED`);
    this.appLogger.log(`${matchedDeposits.length} DEPOSITS MARKED MATCHED`);

    const inProgressPayments: PaymentEntity[] = aggregatedCashPayments
      .filter(
        (aggPayment: AggregatedCashPayment) =>
          aggPayment.status !== MatchStatus.MATCH
      )
      .flatMap((itm: AggregatedCashPayment) =>
        itm.payments.map((itm: PaymentEntity) => ({
          ...itm,
          timestamp: itm.timestamp,
          in_progress_on: currentDate,
          status: MatchStatus.IN_PROGRESS,
        }))
      );

    const inProgressDeposits: CashDepositEntity[] = pendingDeposits
      .filter((itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH)
      .map((itm: CashDepositEntity) => ({
        ...itm,
        status: MatchStatus.IN_PROGRESS,
        in_progress_on: currentDate,
      }));

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(inProgressPayments).length
      } payments set as in progress`
    );
    this.appLogger.log(
      `${inProgressDeposits.length} deposits set as in progress`
    );

    const updatePayments = await this.paymentService.updatePayments([
      ...matchedPayments,
      ...inProgressPayments,
    ]);
    const updateDeposits = await this.cashDepositService.updateDeposits([
      ...matchedDeposits,
      ...inProgressDeposits,
    ]);
    const updatedAggregatedCashPayments =
      this.paymentService.aggregatePayments(updatePayments);

    return {
      dateRange,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      pendingPayments: aggregatedCashPayments.length,
      pendingDeposits: pendingDeposits.length,
      paymentsMatched: matchedPayments.length,
      paymentsInProgress: inProgressPayments.length,
      depositsMatched: matchedDeposits.length,
      depositsInProgress: inProgressDeposits.length,
      totalUpdatedPayments: updatedAggregatedCashPayments.length,
      totalUpdatedDeposits: updateDeposits.length,
    };
  }
}
