import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  differenceInBusinessDays,
  differenceInMinutes,
  format,
  subBusinessDays,
} from 'date-fns';
import { PosHeuristicRound, ReconciliationType } from './types';
import { MatchStatus } from '../common/const';
import { Ministries } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';
/**
 * @description Reconciliation Service for matching POS payments to POS deposits
 * @class
 */
@Injectable()
export class PosReconciliationService {
  /**
   * @constructor
   * @param appLogger
   * @param posDepositService
   * @param paymentService
   */
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PosDepositService) private posDepositService: PosDepositService,
    @Inject(PaymentService) private paymentService: PaymentService
  ) {}

  /**
   * Match POS payments to POS deposits on location, program, date and time based heuristics
   * @param {LocationEntity} location
   * @param {Ministries} program
   * @param {Date} date
   * @returns {Promise<unknown>}
   */

  public async reconcile(
    location: LocationEntity,
    program: Ministries,
    date: Date
  ): Promise<unknown> {
    const dateRange = {
      minDate: format(subBusinessDays(date, 2), 'yyyy-MM-dd'),
      maxDate: format(subBusinessDays(date, 1), 'yyyy-MM-dd'),
    };

    this.appLogger.log(
      `Reconciliation POS: ${dateRange.maxDate} - ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );

    const pendingPayments = await this.paymentService.findPosPayments(
      dateRange,
      location,
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    const pendingDeposits = await this.posDepositService.findPOSDeposits(
      dateRange,
      program,
      location,
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    if (pendingPayments.length === 0 && pendingDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    this.appLogger.log(
      `Payments to be matched: ${pendingPayments.length}`,
      PosReconciliationService.name
    );

    this.appLogger.log(
      `Deposits to be matched: ${pendingDeposits.length}`,
      PosReconciliationService.name
    );

    const roundOneMatches: {
      payment: PaymentEntity;
      deposit: POSDepositEntity;
    }[] = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      pendingDeposits.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      PosHeuristicRound.ONE
    );

    this.appLogger.log(
      `MATCHES - ROUND ONE ${roundOneMatches.length}`,
      PosReconciliationService.name
    );

    const roundTwoMatches: {
      payment: PaymentEntity;
      deposit: POSDepositEntity;
    }[] = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      pendingDeposits.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      PosHeuristicRound.TWO
    );

    this.appLogger.log(
      `MATCHES - ROUND TWO ${roundTwoMatches.length}`,
      PosReconciliationService.name
    );
    const roundThreeMatches: {
      payment: PaymentEntity;
      deposit: POSDepositEntity;
    }[] = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      pendingDeposits.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      PosHeuristicRound.THREE
    );

    this.appLogger.log(
      `MATCHES - ROUND TWO ${roundThreeMatches.length}`,
      PosReconciliationService.name
    );

    const paymentsMatched: PaymentEntity[] =
      await this.paymentService.updatePayments(
        [...roundOneMatches, ...roundTwoMatches, ...roundThreeMatches].map(
          (itm) => itm.payment
        )
      );

    const depositsMatched: POSDepositEntity[] =
      await this.posDepositService.updateDeposits(
        [...roundOneMatches, ...roundTwoMatches, ...roundThreeMatches].map(
          (itm) => itm.deposit
        )
      );

    const paymentsInProgress = await this.paymentService.updatePayments(
      pendingPayments
        .filter((itm) => itm.status === MatchStatus.PENDING)
        .map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
    );

    const depositsInProgress = await this.posDepositService.updateDeposits(
      pendingDeposits
        .filter((itm) => itm.status === MatchStatus.PENDING)
        .map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
    );

    return {
      transaction_date: format(date, 'yyyy-MM-dd'),
      type: ReconciliationType.POS,
      location_id: location.location_id,
      total_deposits_pending: pendingDeposits.length,
      total_payments_pending: pendingPayments.length,
      total_matched_payments: paymentsMatched.length,
      total_matched_deposits: depositsMatched.length,
      total_payments_in_progress: paymentsInProgress.length,
      total_deposits_in_progress: depositsInProgress.length,
    };
  }
  /**
   * Loop through the list of payments and deposits and match them based on the heuristic round
   * @param payments
   * @param deposits
   * @param heuristicRound
   * @returns { payment: PaymentEntity; deposit: POSDepositEntity }[]
   */
  public matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[],
    posHeuristicRound: PosHeuristicRound
  ): { payment: PaymentEntity; deposit: POSDepositEntity }[] {
    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];

    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        if (this.verifyMatch(payment, deposit, posHeuristicRound)) {
          payments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          matches.push({
            payment: {
              ...payment,
              status: MatchStatus.MATCH,
              timestamp: payment.timestamp,
              heuristic_match_round: posHeuristicRound,
              pos_deposit_match: {
                ...deposit,
                heuristic_match_round: posHeuristicRound,
                timestamp: deposit.timestamp,
                status: MatchStatus.MATCH,
              },
            },
            deposit: {
              ...deposit,
              heuristic_match_round: posHeuristicRound,
              status: MatchStatus.MATCH,
              timestamp: deposit.timestamp,
            },
          });
          break;
        }
      }
    }
    return matches;
  }
  /**
   *
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolean}
   */

  public verifyMethod(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.payment_method.method === deposit.payment_method.method;
  }
  /**
   *
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolean}
   */
  public verifyAmount(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.amount === deposit.transaction_amt;
  }
  /**
   *
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolean}
   */
  public verifyPendingStatus(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      payment.status === MatchStatus.PENDING &&
      deposit.status === MatchStatus.PENDING
    );
  }
  /**
   *
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @param {PosHeuristicRound} posHeuristicRound
   * @returns {boolean}
   */
  public verifyTimeMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    heuristicRound: PosHeuristicRound
  ): boolean {
    if (heuristicRound === PosHeuristicRound.ONE) {
      this.appLogger.log(
        `ROUND 1: Difference in minutes ${format(
          payment.timestamp,
          'yyyy-MM-dd'
        )} - ${format(deposit.timestamp, 'yyyy-MM-dd')} ===  ${Math.abs(
          differenceInMinutes(payment.timestamp, deposit.timestamp)
        )}`
      );
      return (
        Math.abs(differenceInMinutes(payment.timestamp, deposit.timestamp)) <= 5
      );
    } else if (heuristicRound === PosHeuristicRound.TWO) {
      this.appLogger.log(
        `ROUND 2: ${payment.transaction.transaction_date} === ${deposit.transaction_date}`
      );
      return payment.transaction.transaction_date === deposit.transaction_date;
    } else if (heuristicRound === PosHeuristicRound.THREE) {
      this.appLogger.log(
        `ROUND 3: Difference in days ${format(
          payment.timestamp,
          'yyyy-MM-dd'
        )} - ${format(deposit.timestamp, 'yyyy-MM-dd')} ===  ${Math.abs(
          differenceInBusinessDays(payment.timestamp, deposit.timestamp)
        )}`
      );
      return (
        Math.abs(
          differenceInBusinessDays(payment.timestamp, deposit.timestamp)
        ) <= 2
      );
    } else return false;
  }
  /**
   *
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @param {PosHeuristicRound} posHeuristicRound
   * @returns {boolean}
   */
  public verifyMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    posHeuristicRound: PosHeuristicRound
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyPendingStatus(payment, deposit) &&
      this.verifyTimeMatch(payment, deposit, posHeuristicRound)
    );
  }

  public async findExceptions(
    location: LocationEntity,
    program: Ministries,
    date: Date
  ): Promise<unknown> {
    const dateRange = {
      minDate: format(subBusinessDays(date, 2), 'yyyy-MM-dd'),
      maxDate: format(subBusinessDays(date, 1), 'yyyy-MM-dd'),
    };

    this.appLogger.log(
      `Exceptions POS: ${dateRange.maxDate} - ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );

    const inProgressPayments =
      await this.paymentService.findPosPaymentExceptions(
        dateRange.minDate,
        location
      );

    const inProgressDeposits =
      await this.posDepositService.findPOSDepositsExceptions(
        dateRange.minDate,
        location,
        program
      );

    if (inProgressPayments.length === 0 && inProgressDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    const paymentExceptions = await this.paymentService.updatePayments(
      inProgressPayments.map((itm) => ({
        ...itm,
        timestamp: itm.timestamp,
        status: MatchStatus.EXCEPTION,
      }))
    );

    const depositExceptions = await this.posDepositService.updateDeposits(
      inProgressDeposits.map((itm) => ({
        ...itm,
        timestamp: itm.timestamp,
        status: MatchStatus.EXCEPTION,
      }))
    );

    return {
      depositExceptions: depositExceptions.length,
      paymentExceptions: paymentExceptions.length,
    };
  }
}
