import { Inject, Injectable, Logger } from '@nestjs/common';
import { format, subBusinessDays } from 'date-fns';
import { PosMatchHeuristics } from './pos-heuristics';
import { PosHeuristicRound, ReconciliationType } from './types';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
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
   * @param posMatchHeuristics
   */
  constructor(
    @Inject(Logger) public readonly appLogger: AppLogger,
    @Inject(PosDepositService) public posDepositService: PosDepositService,
    @Inject(PaymentService) public paymentService: PaymentService,
    @Inject(PosMatchHeuristics) public posMatchHeuristics: PosMatchHeuristics
  ) {}
  /**
   * Match POS payments to POS deposits on location, program, date and time based heuristics
   * @param {LocationEntity} location
   * @param {Ministries} program
   * @param {Date} date
   * @returns {Promise<unknown>}
   */
  async reconcile(
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

    const { pendingPayments, pendingDeposits } =
      await this.findPendingDepositsAndPayments(
        dateRange,
        location,
        Ministries.SBC
      );

    if (pendingPayments.length === 0 || pendingDeposits.length === 0) {
      this.appLogger.log(
        `No Pending Deposits or Payments for: ${location.description} - ${location.location_id}`,
        PosReconciliationService.name
      );
      return {
        message: 'No pending payments or deposits found',
      };
    }

    this.appLogger.log(
      `pending payments ${
        pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING)
          .length
      }`,
      PosReconciliationService.name
    );
    this.appLogger.log(
      `in progress payments ${
        pendingPayments.filter((itm) => itm.status === MatchStatus.IN_PROGRESS)
          .length
      }`,
      PosReconciliationService.name
    );
    this.appLogger.log(
      `pending deposits ${
        pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING)
          .length
      }`,
      PosReconciliationService.name
    );
    this.appLogger.log(
      `in progress deposits ${
        pendingDeposits.filter((itm) => itm.status === MatchStatus.IN_PROGRESS)
          .length
      }`,
      PosReconciliationService.name
    );

    const matchesRoundOne = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((payment) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(payment.status)
      ),
      pendingDeposits.filter((deposit) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(deposit.status)
      ),
      PosHeuristicRound.ONE
    );

    this.appLogger.log(
      `MATCHES - ROUND 1 ${matchesRoundOne.length}`,
      PosReconciliationService.name
    );

    const matchesRoundTwo = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((payment) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(payment.status)
      ),
      pendingDeposits.filter((deposit) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(deposit.status)
      ),
      PosHeuristicRound.TWO
    );

    this.appLogger.log(
      `MATCHES - ROUND 2 ${matchesRoundTwo.length}`,
      PosReconciliationService.name
    );

    const matchesRoundThree = this.matchPosPaymentToPosDeposits(
      pendingPayments.filter((payment) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(payment.status)
      ),
      pendingDeposits.filter((deposit) =>
        [MatchStatus.PENDING, MatchStatus.IN_PROGRESS].includes(deposit.status)
      ),
      PosHeuristicRound.THREE
    );

    this.appLogger.log(
      `MATCHES - ROUND 3 ${matchesRoundThree.length}`,
      PosReconciliationService.name
    );

    const matches = [
      ...matchesRoundOne,
      ...matchesRoundTwo,
      ...matchesRoundThree,
    ];

    const paymentsMatched = matches.map((m) => m.payment);
    const depositsMatched = matches.map((m) => m.deposit);

    const { paymentsInProgress, depositsInProgress } =
      this.setPendingToInProgress(
        pendingPayments.filter((itm) => itm.status === MatchStatus.PENDING),
        pendingDeposits.filter((itm) => itm.status === MatchStatus.PENDING)
      );

    const { paymentExceptions, depositExceptions } =
      this.setInProgressToExceptions(
        pendingPayments.filter((itm) => itm.status === MatchStatus.IN_PROGRESS),
        pendingDeposits.filter((itm) => itm.status === MatchStatus.IN_PROGRESS)
      );

    const total_updated_payments = await this.paymentService.updatePayments([
      ...paymentsMatched,
      ...paymentsInProgress,
      ...paymentExceptions,
    ]);

    const total_updated_deposits = await this.posDepositService.updateDeposits([
      ...depositsMatched,
      ...depositsInProgress,
      ...depositExceptions,
    ]);

    this.appLogger.log(
      `UPDATED ${total_updated_payments.length}`,
      PosReconciliationService.name
    );

    this.appLogger.log(
      `UPDATED ${total_updated_deposits.length}`,
      PosReconciliationService.name
    );

    return {
      transaction_date: format(date, 'yyyy-MM-dd'),
      type: ReconciliationType.POS,
      location_id: location.location_id,

      total_payments_queried: pendingPayments.length,
      total_deposits_queried: pendingDeposits.length,

      total_payments_in_progress: paymentsInProgress.length,
      total_deposits_in_progress: depositsInProgress.length,

      total_payments_exceptions: paymentExceptions.length,
      total_deposits_exceptions: depositExceptions.length,

      total_matched_payments: paymentsMatched.length,
      total_matched_deposits: depositsMatched.length,

      total_updated_payments: total_updated_payments.length,
      total_updated_deposits: total_updated_deposits.length,
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
    heuristicRound: PosHeuristicRound
  ): { payment: PaymentEntity; deposit: POSDepositEntity }[] {
    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];

    for (const [pindex, payment] of payments.entries()) {
      for (const [dindex, deposit] of deposits.entries()) {
        if (this.posMatchHeuristics.isMatch(payment, deposit, heuristicRound)) {
          payments[pindex].status = MatchStatus.MATCH;
          deposits[dindex].status = MatchStatus.MATCH;
          matches.push({
            payment: {
              ...payment,
              status: MatchStatus.MATCH,
              timestamp: payment.timestamp,
              heuristic_match_round: heuristicRound,
              pos_deposit_match: {
                ...deposit,
                timestamp: deposit.timestamp,
                heuristic_match_round: heuristicRound,
                status: MatchStatus.MATCH,
              },
            },
            deposit: {
              ...deposit,
              status: MatchStatus.MATCH,
              heuristic_match_round: heuristicRound,
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
   * Queries for the payments and deposits for a location and date range
   * @param {DateRange} dateRange
   * @param {LocationEntity} location
   * @param {Ministries} program
   * @returns {Promise<{pendingPayments: PaymentEntity[]; pendingDeposits: POSDepositEntity[];}> }
   */
  public async findPendingDepositsAndPayments(
    dateRange: DateRange,
    location: LocationEntity,
    program: Ministries
  ): Promise<{
    pendingPayments: PaymentEntity[];
    pendingDeposits: POSDepositEntity[];
  }> {
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

    return {
      pendingPayments,
      pendingDeposits,
    };
  }
  /**
   * Filter out remaining pending after trying to match and set to in progress
   * @param pendingPayments
   * @param pendingDeposits
   * @returns {paymentsInProgress: PaymentEntity[]; depositsInProgress: POSDepositEntity[];}
   */
  public setPendingToInProgress(
    pendingPayments: PaymentEntity[],
    pendingDeposits: POSDepositEntity[]
  ): {
    paymentsInProgress: PaymentEntity[];
    depositsInProgress: POSDepositEntity[];
  } {
    const paymentsInProgress = pendingPayments.map((itm: PaymentEntity) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.IN_PROGRESS,
    }));

    const depositsInProgress = pendingDeposits.map((itm: POSDepositEntity) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.IN_PROGRESS,
    }));

    return { paymentsInProgress, depositsInProgress };
  }
  /**
   * Filter out the any in progress payments and deposits after trying to match and set to exception
   * @param {PaymentEntity} inProgressPayments
   * @param {POSDepositEntity} inProgressDeposits
   * @returns {paymentExceptions: PaymentEntity[]; depositExceptions: POSDepositEntity[];}
   */
  public setInProgressToExceptions(
    inProgressPayments: PaymentEntity[],
    inProgressDeposits: POSDepositEntity[]
  ): {
    paymentExceptions: PaymentEntity[];
    depositExceptions: POSDepositEntity[];
  } {
    const paymentExceptions = inProgressPayments.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.EXCEPTION,
    }));

    const depositExceptions = inProgressDeposits.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.EXCEPTION,
    }));

    return {
      paymentExceptions,
      depositExceptions,
    };
  }
}
