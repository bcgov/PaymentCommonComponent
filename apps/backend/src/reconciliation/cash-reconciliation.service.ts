import { Injectable, Inject, Logger } from '@nestjs/common';
import { ReconciliationType, AggregatedPayment } from './types';
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
   * @description Find all deposit dates for a given location and program
   */
  public async findDistinctDepositDatesByLocation(
    program: Ministries,
    dateRange: DateRange,
    location: LocationEntity
  ): Promise<Date[]> {
    const dates =
      await this.cashDepositService.findDistinctDepositDatesByLocation(
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
    pastDueDate: Date
  ): Promise<unknown> {
    const payments: PaymentEntity[] =
      await this.paymentService.findPaymentsExceptions(location, pastDueDate);

    const deposits: CashDepositEntity[] =
      await this.cashDepositService.findExceptions(
        pastDueDate,
        program,
        location
      );

    if (payments.length === 0) {
      return;
    }
    const paymentExceptions: PaymentEntity[] =
      await this.paymentService.updatePayments(
        payments.map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.EXCEPTION
        }))
      );

    const depositExceptions: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(
        deposits.map((itm) => ({
          ...itm,
          status: MatchStatus.EXCEPTION
        }))
      );

    return {
      payments: paymentExceptions.length,
      deposits: depositExceptions.length
    };
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
    aggregatedPayments: AggregatedPayment[];
    deposits: CashDepositEntity[];
  } {
    this.appLogger.log(
      `MATCHING: ${aggregatedPayments.length} AGGREGATED PAYMENTS to ${deposits.length} DEPOSITS`,
      CashReconciliationService.name
    );
    for (const [dindex, deposit] of deposits.entries()) {
      for (const [pindex, payment] of aggregatedPayments.entries()) {
        if (
          payment.status !== MatchStatus.MATCH &&
          deposit.status !== MatchStatus.MATCH &&
          payment.payments.every(
            ({ cash_deposit_match }) => cash_deposit_match === undefined
          ) &&
          Math.abs(deposit.deposit_amt_cdn - payment.amount) < 0.001
        ) {
          deposits[dindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].status = MatchStatus.MATCH;
          aggregatedPayments[pindex].payments = payment.payments.map((itm) => ({
            ...itm,
            timestamp: itm.timestamp,
            status: MatchStatus.MATCH,
            cash_deposit_match: deposits[dindex]
          }));

          this.appLogger.log(
            `MATCHED PAYMENT: ${payment.amount} TO DEPOSIT: ${deposit.deposit_amt_cdn}`,
            CashReconciliationService.name
          );
          break;
        }
      }
    }

    return {
      aggregatedPayments,
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
    dateRange: DateRange
  ): Promise<unknown> {
    const pendingDeposits: CashDepositEntity[] =
      await this.cashDepositService.findCashDepositsByDateLocationAndProgram(
        program,
        dateRange,
        location,
        [MatchStatus.IN_PROGRESS, MatchStatus.PENDING]
      );

    const aggregatedPayments: AggregatedPayment[] =
      await this.paymentService.getAggregatedPaymentsByCashDepositDates(
        dateRange,
        location
      );
    this.appLogger.log(
      `${aggregatedPayments.length} AGGREGATED PAYMENTS PENDING RECONCILIATION`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${pendingDeposits.length} DEPOSITS PENDING RECONCILIATION`,
      CashReconciliationService.name
    );
    if (pendingDeposits.length === 0 || aggregatedPayments.length === 0) {
      this.appLogger.log(
        'No pending payments or deposits found',
        CashReconciliationService.name
      );
      return;
    }

    const afterMatch: {
      aggregatedPayments: AggregatedPayment[];
      deposits: CashDepositEntity[];
    } = this.matchPaymentsToDeposits(aggregatedPayments, pendingDeposits);

    const matchedPayments: AggregatedPayment[] =
      afterMatch.aggregatedPayments.filter(
        (itm: AggregatedPayment) => itm.status === MatchStatus.MATCH
      );

    const matchedDeposits: CashDepositEntity[] = afterMatch.deposits.filter(
      (itm: CashDepositEntity) => itm.status === MatchStatus.MATCH
    );
    this.appLogger.log(
      `${matchedPayments.length} AFTER MATCH PAYMENTS MARKED MATCHED`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${matchedDeposits.length} AFTER MATCH DEPOSITS MARKED MATCHED`,
      CashReconciliationService.name
    );
    const inProgressPayments: PaymentEntity[] = afterMatch.aggregatedPayments
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

    const inProgressDeposits: CashDepositEntity[] = afterMatch.deposits
      .filter((itm: CashDepositEntity) => itm.status !== MatchStatus.MATCH)
      .map((itm: CashDepositEntity) => ({
        ...itm,
        status: MatchStatus.IN_PROGRESS
      }));

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(inProgressPayments).length
      } AFTER MATCH PAYMENTS MARKED IN_PROGRESS`,
      CashReconciliationService.name
    );
    this.appLogger.log(
      `${inProgressDeposits.length} AFTER MATCH DEPOSITS MARKED IN_PROGRESS`,
      CashReconciliationService.name
    );

    const paymentsMatched: PaymentEntity[] =
      await this.paymentService.updatePayments(
        matchedPayments.flatMap((itm) =>
          itm.payments.map((payment) => ({
            ...payment,
            timestamp: payment.timestamp
          }))
        )
      );

    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(paymentsMatched).length
      } PAYMENTS MATCHED UPDATED TO DB`,
      CashReconciliationService.name
    );
    const updatedPaymentsInProgress: PaymentEntity[] =
      await this.paymentService.updatePayments(inProgressPayments);
    this.appLogger.log(
      `${
        this.paymentService.aggregatePayments(updatedPaymentsInProgress).length
      } PAYMENTS IN_PROGRESS UPDATED TO DB`,
      CashReconciliationService.name
    );

    const updatedDepositsMatched: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(matchedDeposits);
    this.appLogger.log(
      `${updatedDepositsMatched.length} DEPOSITS MATCHED UPDATED TO DB`,
      CashReconciliationService.name
    );
    const updatedDepositsInProgress: CashDepositEntity[] =
      await this.cashDepositService.updateDeposits(inProgressDeposits);

    this.appLogger.log(
      `${updatedDepositsInProgress.length} DEPOSITS IN_PROGRESS UPDATED TO DB`,
      CashReconciliationService.name
    );

    return {
      dateRange,
      type: ReconciliationType.CASH,
      location_id: location.location_id,
      pendingPayments: aggregatedPayments.length,
      pendingDeposits: pendingDeposits.length,
      paymentsMatched:
        this.paymentService.aggregatePayments(paymentsMatched).length,
      paymentsInProgress: this.paymentService.aggregatePayments(
        updatedPaymentsInProgress
      ).length,
      depositsMatched: updatedDepositsMatched.length,
      depositsInProgress: updatedDepositsInProgress.length
    };
  }
}
