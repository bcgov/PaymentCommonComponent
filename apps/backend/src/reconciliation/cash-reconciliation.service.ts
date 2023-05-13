import { Injectable, Inject, Logger } from '@nestjs/common';
import { ReconciliationType, AggregatedPayment } from './types';
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
    aggregatedPayment: AggregatedPayment;
    deposit: CashDepositEntity;
  }[] {
    const matches: {
      aggregatedPayment: AggregatedPayment;
      deposit: CashDepositEntity;
    }[] = [];

    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of aggregatedPayments.entries()) {
        if (this.checkMatch(payment, deposit)) {
          this.appLogger.log(
            `MATCHED PAYMENT: ${payment.amount} TO DEPOSIT: ${deposit.deposit_amt_cdn}`,
            CashReconciliationService.name
          );
          (deposits[dindex] = { ...deposit, status: MatchStatus.MATCH }),
            (aggregatedPayments[pindex] = {
              ...payment,
              status: MatchStatus.MATCH,
              payments: payment.payments.map((itm) => ({
                ...itm,
                timestamp: itm.timestamp,
                status: MatchStatus.MATCH,
                cash_deposit_match: deposits[dindex]
              }))
            });
          matches.push({
            aggregatedPayment: aggregatedPayments[pindex],
            deposit: deposits[dindex]
          });
        }
        break;
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
    if (pendingDeposits.length === 0 && aggregatedPayments.length === 0) {
      this.appLogger.log(
        'No pending payments / deposits found',
        CashReconciliationService.name
      );
      return;
    }

    this.appLogger.log(
      `${aggregatedPayments.length} aggregated payments pending reconciliation`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${pendingDeposits?.length} deposits pending reconciliation`,
      CashReconciliationService.name
    );

    const matches = this.matchPaymentsToDeposits(
      aggregatedPayments.filter((itm) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(itm.status)
      ),
      pendingDeposits.filter((itm) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(itm.status)
      )
    );

    const matchedPayments: PaymentEntity[] = matches
      .map((itm) => itm.aggregatedPayment)
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

    const inProgressPayments: PaymentEntity[] = aggregatedPayments
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

    const inProgressDeposits: CashDepositEntity[] = pendingDeposits
      .filter((itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH)
      .map((itm: CashDepositEntity) => ({
        ...itm,
        status: MatchStatus.IN_PROGRESS
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
      ...inProgressPayments
    ]);
    const updateDeposits = await this.cashDepositService.updateDeposits([
      ...matchedDeposits,
      ...inProgressDeposits
    ]);
    const updatedAggregatedPayments =
      this.paymentService.aggregatePayments(updatePayments);

    return {
      dateRange,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      pendingPayments: aggregatedPayments.length,
      pendingDeposits: pendingDeposits.length,
      paymentsMatched: matchedPayments.length,
      paymentsInProgress: inProgressPayments.length,
      depositsMatched: matchedDeposits.length,
      depositsInProgress: inProgressDeposits.length,
      totalUpdatedPayments: updatedAggregatedPayments.length,
      totalUpdatedDeposits: updateDeposits.length
    };
  }
}
