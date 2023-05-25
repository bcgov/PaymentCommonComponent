import { Injectable, Inject, Logger } from '@nestjs/common';
import { differenceInBusinessDays, differenceInMinutes } from 'date-fns';
import {
  PosDepositsAmountDictionary,
  PosDepositsDateDictionary,
  PosHeuristicRound,
  ReconciliationType,
} from './types';
import { MatchStatus } from '../common/const';
import { DateRange, Ministries } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { LocationEntity } from '../location/entities/master-location-data.entity';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';
import {
  addBusinessDaysNoTimezone,
  subtractBusinessDaysNoTimezone,
} from '../common/utils/format';

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
    pendingPayments: PaymentEntity[],
    pendingDeposits: POSDepositEntity[]
  ): Promise<unknown> {
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

    const locationPosDepositsDictionary =
      this.buildPosDepositsDictionary(pendingDeposits);

    const matches = [];
    for (const heuristic in PosHeuristicRound) {
      const roundMatches = this.matchPosPaymentToPosDeposits(
        pendingPayments.filter(
          (itm) =>
            itm.status === MatchStatus.PENDING ||
            itm.status === MatchStatus.IN_PROGRESS
        ),
        locationPosDepositsDictionary,
        PosHeuristicRound[heuristic as PosHeuristicRound]
      );
      matches.push(...roundMatches);
      this.appLogger.log(
        `MATCHES - ROUND ${heuristic} - ${roundMatches.length} matches`,
        PosReconciliationService.name
      );
    }

    const paymentsMatched = matches.map((itm) => itm.payment);
    await this.paymentService.updatePaymentStatus(paymentsMatched);

    const depositsMatched = matches.map((itm) => itm.deposit);
    await this.posDepositService.updateDepositStatus(
      depositsMatched // To MATCH
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

    const inProgressDeposits: POSDepositEntity[] = [];
    Object.keys(locationPosDepositsDictionary).forEach((amount) => {
      Object.keys(locationPosDepositsDictionary[amount]).forEach((date) => {
        inProgressDeposits.push(...locationPosDepositsDictionary[amount][date]);
      });
    });

    const depositsInProgress = await this.posDepositService.updateDeposits(
      inProgressDeposits
        .filter((itm) => itm.status === MatchStatus.PENDING)
        .map((itm) => ({
          ...itm,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
    );

    return {
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

  public buildPosDepositsDictionary(
    deposits: POSDepositEntity[]
  ): PosDepositsAmountDictionary {
    // Put deposits into a dictionary, first layer keys are amount, second layer keys are dates
    // This makes it more efficient to find than looping through all deposits
    return deposits.reduce((acc: PosDepositsAmountDictionary, posDeposit) => {
      const amount = posDeposit.transaction_amt;
      const date = posDeposit.transaction_date;
      const paymentMethod = posDeposit.payment_method.method;
      if (acc[amount]) {
        if (acc[amount][`${date}-${paymentMethod}`]) {
          acc[amount][`${date}-${paymentMethod}`].push(posDeposit);
        } else {
          acc[amount][`${date}-${paymentMethod}`] = [posDeposit];
        }
      } else {
        acc[amount] = {
          [`${date}-${paymentMethod}`]: [posDeposit],
        };
      }
      return acc;
    }, {});
  }

  public matchPosPaymentToPosDeposits(
    payments: PaymentEntity[],
    locationDeposits: PosDepositsAmountDictionary,
    posHeuristicRound: PosHeuristicRound
  ): { payment: PaymentEntity; deposit: POSDepositEntity }[] {
    if (posHeuristicRound === PosHeuristicRound.FOUR) {
      return [];
    }
    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];
    for (const [pindex, payment] of payments.entries()) {
      // find amount
      const depositsWithAmount: PosDepositsDateDictionary | null =
        locationDeposits[payment.amount];
      const paymentMethod = payment.payment_method.method;
      if (depositsWithAmount) {
        // if amount found, find time
        const dateToFind = payment.transaction.transaction_date;
        let deposits: POSDepositEntity[] | null =
          depositsWithAmount[`${dateToFind}-${paymentMethod}`];
        if (!deposits?.length) {
          // For round three, a deposit can be one business day apart from the payment
          // Could be the day before, or the day after, so we search those days for the amount
          if (posHeuristicRound === PosHeuristicRound.THREE) {
            const dayAfterDateToFind = addBusinessDaysNoTimezone(dateToFind, 1);
            deposits =
              depositsWithAmount[`${dayAfterDateToFind}-${paymentMethod}`];
            if (!deposits?.length) {
              const dayBeforeDateToFind = subtractBusinessDaysNoTimezone(
                dateToFind,
                1
              );
              deposits =
                depositsWithAmount[`${dayBeforeDateToFind}-${paymentMethod}`];
            }
          }
        }
        if (deposits?.length) {
          // In case there are multiple deposits of the same amount in a single day
          const dIndex = deposits.findIndex(
            (dpst) =>
              dpst.status !== MatchStatus.MATCH &&
              this.verifyMethod(payment, dpst) &&
              this.verifyTimeMatch(payment, dpst, posHeuristicRound)
          );
          if (dIndex > -1) {
            // Match found!
            const deposit = deposits.splice(dIndex, 1)[0];
            payments[pindex].status = MatchStatus.MATCH;
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
            // Pull it out of the dictionary
            if (deposits.length) {
              depositsWithAmount[dateToFind] = deposits;
            } else {
              delete depositsWithAmount[dateToFind];
              // delete from parent dictionary?
            }
          }
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

  public async setExceptions(
    location: LocationEntity,
    program: Ministries,
    date: string
  ): Promise<unknown> {
    this.appLogger.log(
      `Exceptions POS: ${date} - ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );

    const inProgressPayments =
      await this.paymentService.findPosPaymentExceptions(date, location);

    const inProgressDeposits =
      await this.posDepositService.findPOSDepositsExceptions(
        date,
        location.location_id,
        program
      );

    if (inProgressPayments.length === 0 && inProgressDeposits.length === 0) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    const updatedPayments = inProgressPayments.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.EXCEPTION,
    }));
    const paymentExceptions = await this.paymentService.updatePaymentStatus(
      updatedPayments // TO EXCEPTION
    );

    const updatedDeposits = inProgressDeposits.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      status: MatchStatus.EXCEPTION,
    }));
    const depositExceptions = await this.posDepositService.updateDepositStatus(
      updatedDeposits // TO EXCEPTION
    );

    return {
      depositExceptions: depositExceptions.length,
      paymentExceptions: paymentExceptions.length,
    };
  }
}
