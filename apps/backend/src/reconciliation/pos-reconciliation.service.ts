import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  differenceInBusinessDays,
  differenceInMinutes,
  format,
  subBusinessDays,
} from 'date-fns';
import { PosHeuristicRound, ReconciliationType } from './types';
import { MatchStatus } from '../common/const';
import {
  AggregatedDeposit,
  AggregatedPosPayment,
  Ministries,
} from '../constants';
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
      minDate: format(subBusinessDays(date, 1), 'yyyy-MM-dd'),
      maxDate: format(date, 'yyyy-MM-dd'),
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
      location.location_id,
      [MatchStatus.PENDING, MatchStatus.IN_PROGRESS]
    );

    if (pendingPayments.length === 0 || pendingDeposits.length === 0) {
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
      `MATCHES - ROUND THREE ${roundThreeMatches.length}`,
      PosReconciliationService.name
    );

    const aggregated = this.aggregatePaymentsAndDeposits(
      pendingPayments.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      pendingDeposits.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      )
    );

    const roundFourMatches = this.matchPosPaymentToPosDepositsRoundFour(
      aggregated.payments.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      aggregated.deposits.filter(
        (itm) =>
          itm.status === MatchStatus.PENDING ||
          itm.status === MatchStatus.IN_PROGRESS
      ),
      PosHeuristicRound.FOUR
    );

    this.appLogger.log(`MATCHES - ROUND FOUR ${roundFourMatches.length}`);

    const paymentsMatchRoundFour: PaymentEntity[] = roundFourMatches.flatMap(
      (itm) => itm.payment.payments
    );
    const depositsMatchRoundFour: POSDepositEntity[] = roundFourMatches.flatMap(
      (itm) => itm.deposit.deposits
    );

    const prevRounds = [
      ...roundOneMatches,
      ...roundTwoMatches,
      ...roundThreeMatches,
    ].map((itm) => itm.payment);

    const paymentsMatched: PaymentEntity[] = [
      ...prevRounds,
      ...paymentsMatchRoundFour,
    ];

    const prevDepositRounds = [
      ...roundOneMatches,
      ...roundTwoMatches,
      ...roundThreeMatches,
    ].map((itm) => itm.deposit);

    const depositsMatched: POSDepositEntity[] = [
      ...prevDepositRounds,
      ...depositsMatchRoundFour,
    ];

    const paymentsInProgress = pendingPayments
      .filter((itm) => itm.status === MatchStatus.PENDING)
      .map((itm) => ({
        ...itm,
        timestamp: itm.timestamp,
        status: MatchStatus.IN_PROGRESS,
      }));

    const depositsInProgress = pendingDeposits
      .filter((itm) => itm.status === MatchStatus.PENDING)
      .map((itm) => ({
        ...itm,
        timestamp: itm.timestamp,
        status: MatchStatus.IN_PROGRESS,
      }));

    const totalUpdatedPayments = await Promise.all(
      await this.paymentService.updatePayments([
        ...paymentsMatched,
        ...paymentsInProgress,
      ])
    );
    const totalUpdatedDeposits = await Promise.all(
      await this.posDepositService.updateDeposits([
        ...depositsMatched,
        ...depositsInProgress,
      ])
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
      total_payments_updated: totalUpdatedPayments.length,
      total_deposits_updated: totalUpdatedDeposits.length,
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
  public matchPosPaymentToPosDepositsRoundFour(
    payments: AggregatedPosPayment[],
    deposits: AggregatedDeposit[],

    posHeuristicRound: PosHeuristicRound
  ): { payment: AggregatedPosPayment; deposit: AggregatedDeposit }[] {
    const matches: {
      payment: AggregatedPosPayment;
      deposit: AggregatedDeposit;
    }[] = [];

    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        if (this.verifyRoundFour(payment, deposit)) {
          payments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          payments[pindex].payments = payments[pindex].payments.map((itm) => ({
            ...itm,
            status: MatchStatus.MATCH,
            timestamp: itm.timestamp,
            heuristic_match_round: posHeuristicRound,
          }));
          deposits[dindex].deposits = deposits[dindex].deposits.map((itm) => ({
            ...itm,
            status: MatchStatus.MATCH,
            timestamp: itm.timestamp,
            heuristic_match_round: posHeuristicRound,
          }));
          matches.push({
            payment: {
              ...payment,
              status: MatchStatus.MATCH,
              timestamp: payment.timestamp,
              heuristic_match_round: posHeuristicRound,
              payments: payment.payments.map((itm) => ({
                ...itm,
                status: MatchStatus.MATCH,
                timestamp: itm.timestamp,
                heuristic_match_round: posHeuristicRound,
                round_four_deposits: deposit.deposits,
              })),
            },
            deposit: {
              ...deposit,
              heuristic_match_round: posHeuristicRound,
              status: MatchStatus.MATCH,
              timestamp: deposit.timestamp,
              deposits: deposit.deposits.map((itm) => ({
                ...itm,
                status: MatchStatus.MATCH,
                timestamp: itm.timestamp,
                heuristic_match_round: posHeuristicRound,
                round_four_payments: payment.payments,
              })),
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
    return Math.abs(deposit.transaction_amt - payment.amount) < 0.01;
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
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
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
      return (
        Math.abs(differenceInMinutes(payment.timestamp, deposit.timestamp)) <= 5
      );
    } else if (heuristicRound === PosHeuristicRound.TWO) {
      return payment.transaction.transaction_date === deposit.transaction_date;
    } else if (heuristicRound === PosHeuristicRound.THREE) {
      return (
        Math.abs(
          differenceInBusinessDays(payment.timestamp, deposit.timestamp)
        ) <= 2
      );
    } else if (heuristicRound === PosHeuristicRound.FOUR) {
      return payment.transaction.transaction_date === deposit.transaction_date;
    } else return false;
  }
  public verifyRoundFour(
    payment: AggregatedPosPayment,
    deposit: AggregatedDeposit
  ): boolean {
    return (
      payment.transaction_date === deposit.transaction_date &&
      Math.abs(deposit.transaction_amt - payment.amount) < 0.01 &&
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
    );
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
    this.appLogger.log(
      `Exceptions POS: ${format(date, 'yyyy-MM-dd')} - ${
        location.description
      } - ${location.location_id}`
    );

    const inProgressPayments =
      await this.paymentService.findPosPaymentExceptions(
        format(date, 'yyyy-MM-dd'),
        location
      );

    const inProgressDeposits =
      await this.posDepositService.findPOSDepositsExceptions(
        format(date, 'yyyy-MM-dd'),
        location.location_id,
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
  /* eslint-disable @typescript-eslint/no-explicit-any */
  public aggregatePaymentsAndDeposits(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): { payments: AggregatedPosPayment[]; deposits: AggregatedDeposit[] } {
    const aggPayments = payments.reduce((acc: any, itm: PaymentEntity) => {
      const key = itm.transaction.transaction_date;
      if (!acc[key]) {
        acc[key] = {
          transaction_date: itm.transaction.transaction_date,
          amount: 0,
          status: MatchStatus.IN_PROGRESS,
          timestamp: itm.timestamp,
          heuristic_match_round: undefined,
          round_four_deposits: [],
          payments: [],
        };
      }
      acc[key].amount += itm.amount;
      acc[key].payments.push(itm);

      return acc;
    }, {});

    const aggDeposits = deposits.reduce((acc: any, itm: POSDepositEntity) => {
      const key = itm.transaction_date;
      if (!acc[key]) {
        acc[key] = {
          transaction_amt: 0,
          status: MatchStatus.IN_PROGRESS,
          transaction_date: itm.transaction_date,
          timestamp: itm.timestamp,
          heuristic_match_round: undefined,
          round_four_payments: [],
          deposits: [],
        };
      }
      acc[key].transaction_amt += itm.transaction_amt;
      acc[key].deposits.push(itm);
      return acc;
    }, {});
    const aggregatedPayments: AggregatedPosPayment[] =
      Object.values(aggPayments);
    const aggregatedDeposits: AggregatedDeposit[] = Object.values(aggDeposits);
    return {
      payments: aggregatedPayments.sort(
        (a: AggregatedPosPayment, b: AggregatedPosPayment) =>
          a.amount - b.amount
      ) as AggregatedPosPayment[],
      deposits: aggregatedDeposits.sort(
        (a: AggregatedDeposit, b: AggregatedDeposit) =>
          a.transaction_amt - b.transaction_amt
      ) as AggregatedDeposit[],
    };
  }
}
