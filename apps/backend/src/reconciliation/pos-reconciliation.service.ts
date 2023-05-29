import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  addBusinessDays,
  differenceInBusinessDays,
  differenceInMinutes,
  format,
  subBusinessDays,
} from 'date-fns';
import {
  PosDepositsAmountDictionary,
  PosDepositsDateDictionary,
  PosHeuristicRound,
  ReconciliationType,
} from './types';
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

    // Put deposits into a dictionary, first layer keys are amount, second layer keys are dates
    // This makes it more efficient to find than looping through all deposits
    const locationPosDepositsDictionary = pendingDeposits.reduce(
      (acc: PosDepositsAmountDictionary, posDeposit) => {
        const amount = posDeposit.transaction_amt;
        const date = posDeposit.transaction_date;
        if (acc[amount]) {
          if (acc[amount][date]) {
            acc[amount][date].push(posDeposit);
          } else {
            acc[amount][date] = [posDeposit];
          }
        } else {
          acc[amount] = {
            [date]: [posDeposit],
          };
        }
        return acc;
      },
      {}
    );

    const matches = [];
    // This needs to be cleaned up. Had some issues passing in the enum to a function
    for (const heuristic in PosHeuristicRound) {
      const heur: PosHeuristicRound = (() => {
        if (heuristic === PosHeuristicRound.ONE) {
          return PosHeuristicRound.ONE;
        }
        if (heuristic === PosHeuristicRound.TWO) {
          return PosHeuristicRound.TWO;
        }
        if (heuristic === PosHeuristicRound.THREE) {
          return PosHeuristicRound.THREE;
        }
        return PosHeuristicRound.ONE;
      })();
      const roundMatches = this.matchPosPaymentToPosDepositsDict(
        pendingPayments.filter(
          (itm) =>
            itm.status === MatchStatus.PENDING ||
            itm.status === MatchStatus.IN_PROGRESS
        ),
        locationPosDepositsDictionary,
        heur
      );
      matches.push(...roundMatches);
      this.appLogger.log(
        `MATCHES - ROUND ${heur} - ${roundMatches.length} matches`,
        PosReconciliationService.name
      );
    }

    const paymentsMatched = matches.map((itm) => itm.payment);
    await this.paymentService.matchPayments(paymentsMatched);

    const depositsMatched = matches.map((itm) => itm.deposit);
    await this.posDepositService.matchDeposits(depositsMatched);

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

  public matchPosPaymentToPosDepositsDict(
    payments: PaymentEntity[],
    locationDeposits: PosDepositsAmountDictionary,
    posHeuristicRound: PosHeuristicRound
  ): any {
    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];
    for (const [pindex, payment] of payments.entries()) {
      // find amount
      const depositsWithAmount: PosDepositsDateDictionary | null =
        locationDeposits[payment.amount];
      if (depositsWithAmount) {
        // if amount found, find time
        let dateToFind = payment.transaction.transaction_date;
        let deposits: POSDepositEntity[] | null =
          depositsWithAmount[dateToFind];
        if (!deposits?.length) {
          if (posHeuristicRound === PosHeuristicRound.THREE) {
            this.appLogger.log(dateToFind);
            dateToFind = format(
              addBusinessDays(new Date(dateToFind), 1),
              'yyyy-MM-dd'
            );
            deposits = depositsWithAmount[dateToFind];
          }
        }

        if (deposits?.length) {
          // this.appLogger.log(
          //   `Payment ${payment.id} for date ${dateToFind} and deposits ${deposits.length}`
          // );
          const dIndex = deposits.findIndex(
            (dpst) =>
              dpst.status !== MatchStatus.MATCH &&
              this.verifyMethod(payment, dpst) &&
              this.verifyTimeMatch(payment, dpst, posHeuristicRound)
          );
          if (dIndex > -1) {
            // Match found!
            const deposit = deposits.splice(dIndex, 1)[0];
            // Affect payment
            // Affect deposit
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
      // this.appLogger.log(
      //   `ROUND 1: Difference in minutes ${format(
      //     payment.timestamp,
      //     'yyyy-MM-dd'
      //   )} - ${format(deposit.timestamp, 'yyyy-MM-dd')} ===  ${Math.abs(
      //     differenceInMinutes(payment.timestamp, deposit.timestamp)
      //   )}`,
      //   PosReconciliationService.name
      // );
      return (
        Math.abs(differenceInMinutes(payment.timestamp, deposit.timestamp)) <= 5
      );
    } else if (heuristicRound === PosHeuristicRound.TWO) {
      // this.appLogger.log(
      //   `ROUND 2: ${payment.transaction.transaction_date} === ${deposit.transaction_date}`,
      //   PosReconciliationService.name
      // );
      return payment.transaction.transaction_date === deposit.transaction_date;
    } else if (heuristicRound === PosHeuristicRound.THREE) {
      // this.appLogger.log(
      //   `ROUND 3: Difference in days ${format(
      //     payment.timestamp,
      //     'yyyy-MM-dd'
      //   )} - ${format(deposit.timestamp, 'yyyy-MM-dd')} ===  ${Math.abs(
      //     differenceInBusinessDays(payment.timestamp, deposit.timestamp)
      //   )}`,
      //   PosReconciliationService.name
      // );
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
}
