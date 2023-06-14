import { Injectable, Inject, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ReconciliationType, AggregatedCashPayment } from './types';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries, NormalizedLocation } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

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
    location: NormalizedLocation
  ): Promise<string[]> {
    this.appLogger.log({ dateRange }, CashReconciliationService.name);

    return await this.cashDepositService.findCashDepositDatesByLocation(
      program,
      dateRange,
      location.pt_location_id
    );
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
          this.appLogger.log(
            `MATCHED PAYMENT: ${payment.amount} TO DEPOSIT: ${deposit.deposit_amt_cdn}`,
            CashReconciliationService.name
          );
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
    location: NormalizedLocation,
    program: Ministries,
    dateRange: DateRange
  ): Promise<unknown> {
    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDate(
        program,
        dateRange.maxDate,
        location.pt_location_id,
        [MatchStatus.IN_PROGRESS, MatchStatus.PENDING]
      );

    const aggregatedCashPayments: AggregatedCashPayment[] =
      await this.paymentService.getAggregatedCashPaymentsByCashDepositDates(
        dateRange,
        location.location_id
      );
    if (pendingDeposits.length === 0 || aggregatedCashPayments.length === 0) {
      this.appLogger.log(
        'No pending payments / deposits found',
        CashReconciliationService.name
      );
      return;
    }

    this.appLogger.log(
      `${aggregatedCashPayments.length} aggregated payments pending reconciliation`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${pendingDeposits?.length} deposits pending reconciliation`,
      CashReconciliationService.name
    );

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
      .flatMap((itm) => itm.payments);

    const matchedDeposits: CashDepositEntity[] = matches.map(
      (itm) => itm.deposit
    );

    this.appLogger.log(
      `${matchedPayments.length} PAYMENTS MARKED MATCHED`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${matchedDeposits.length} DEPOSITS MARKED MATCHED`,
      CashReconciliationService.name
    );

    const inProgressPayments: PaymentEntity[] = aggregatedCashPayments
      .filter(
        (aggPayment: AggregatedCashPayment) =>
          aggPayment.status !== MatchStatus.MATCH
      )
      .flatMap((itm: AggregatedCashPayment) =>
        itm.payments.map((itm: PaymentEntity) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
      );

    const inProgressDeposits: CashDepositEntity[] = pendingDeposits
      .filter((itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH)
      .map((itm: CashDepositEntity) => ({
        ...itm,
        status: MatchStatus.IN_PROGRESS,
      }));

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(inProgressPayments).length
      } payments set as in progress`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${inProgressDeposits.length} deposits set as in progress`,
      CashReconciliationService.name
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
