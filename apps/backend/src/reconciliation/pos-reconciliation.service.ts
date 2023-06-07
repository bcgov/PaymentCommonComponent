import { Injectable, Inject, Logger } from '@nestjs/common';
import { differenceInBusinessDays, differenceInMinutes } from 'date-fns';
import {
  PosDepositsAmountDictionary,
  PosDepositsDateDictionary,
  PosHeuristicRound,
  ReconciliationType,
} from './types';
import { MatchStatus } from '../common/const';
import { subtractBusinessDaysNoTimezone } from '../common/utils/format';
import {
  AggregatedDeposit,
  AggregatedPosPayment,
  Ministries,
  NormalizedLocation,
} from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
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
    location: NormalizedLocation,
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

    const matches: { payment: PaymentEntity; deposit: POSDepositEntity }[] = [];
    const matchesRoundFour: {
      payments: PaymentEntity[];
      deposits: POSDepositEntity[];
    }[] = [];
    const roundFourMatches = (round: PosHeuristicRound) => {
      const alreadyMatchedDeposits = matches.map((itm) => itm?.deposit);
      const roundMatches = this.matchPosPaymentToPosDepositsRoundFour(
        this.aggregatePayments(
          pendingPayments
            .filter(
              (itm) =>
                itm.status === MatchStatus.PENDING ||
                itm.status === MatchStatus.IN_PROGRESS
            )
            .filter((itm) => itm.status !== MatchStatus.MATCH)
        ),
        this.buildPosDepositsDictionary(
          this.aggregateDeposits(
            pendingDeposits.filter(
              (itm) =>
                !alreadyMatchedDeposits.find((deposit) => deposit.id === itm.id)
            )
          ) as unknown[] as POSDepositEntity[]
        ),
        round
      );
      matchesRoundFour.push(...roundMatches);
      this.appLogger.log(
        `MATCHES - ROUND ${round} - ${roundMatches.length} matches`,
        PosReconciliationService.name
      );
    };

    for (const heuristic in PosHeuristicRound) {
      if (heuristic === PosHeuristicRound.FOUR) {
        roundFourMatches(heuristic);
      } else {
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
    }
    // calling save on round four matches vs update in order to insert new records on the many to many join
    const paymentsMatchedRoundFour = await this.paymentService.updatePayments(
      matchesRoundFour.flatMap((itm) => itm.payments)
    );

    const depositsMatchedRoundFour =
      await this.posDepositService.updateDeposits(
        matchesRoundFour.flatMap((itm) => itm.deposits)
      );

    const paymentsMatched = matches.map((itm) => itm.payment);
    await this.paymentService.updatePaymentStatus(paymentsMatched);

    const depositsMatched = matches.map((itm) => itm.deposit);
    await this.posDepositService.updateDepositStatus(
      depositsMatched // To MATCH
    );

    const paymentsInProgress = await this.paymentService.updatePayments(
      pendingPayments
        .filter(
          (itm) =>
            !paymentsMatchedRoundFour.find((payment) => payment.id === itm.id)
        )
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
        .filter(
          (itm) =>
            !depositsMatchedRoundFour.find((deposit) => deposit.id === itm.id)
        )
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
      total_matched_payments:
        paymentsMatched.length + paymentsMatchedRoundFour.length,
      total_matched_deposits:
        depositsMatched.length + depositsMatchedRoundFour.length,
      total_payments_in_progress: paymentsInProgress.length,
      total_deposits_in_progress: depositsInProgress.length,
      total_payments_updated:
        paymentsMatched.length +
        paymentsInProgress.length +
        paymentsMatchedRoundFour.length,
      total_deposits_updated:
        depositsMatched.length +
        depositsInProgress.length +
        depositsMatchedRoundFour.length,
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
          if (posHeuristicRound === PosHeuristicRound.THREE) {
            const dayBeforeDateToFind = subtractBusinessDaysNoTimezone(
              dateToFind,
              1
            );
            deposits =
              depositsWithAmount[`${dayBeforeDateToFind}-${paymentMethod}`];
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
   * round four matching based on aggregated payments and deposits by date and method
   * @param payments
   * @param locationDeposits
   * @param posHeuristicRound
   * @returns
   */
  public matchPosPaymentToPosDepositsRoundFour(
    aggregatedPayments: AggregatedPosPayment[],
    aggregatedLocationDeposits: PosDepositsAmountDictionary,
    posHeuristicRound: PosHeuristicRound
  ): { payments: PaymentEntity[]; deposits: POSDepositEntity[] }[] {
    const matches: {
      payments: PaymentEntity[];
      deposits: POSDepositEntity[];
    }[] = [];

    for (const [pindex, payment] of aggregatedPayments.entries()) {
      // find amount
      const depositsWithAmount: PosDepositsDateDictionary | null =
        aggregatedLocationDeposits[payment.amount];
      const paymentMethod = payment.payment_method.method;
      if (depositsWithAmount) {
        // if amount found, find time
        const dateToFind = payment.transaction.transaction_date;
        const deposits: POSDepositEntity[] | null =
          depositsWithAmount[`${dateToFind}-${paymentMethod}`];
        if (deposits?.length) {
          // In case there are multiple deposits of the same amount in a single day
          const dIndex = deposits.findIndex(
            (dpst) =>
              dpst.status !== MatchStatus.MATCH &&
              this.verifyRoundFour(
                payment,
                dpst as unknown as AggregatedDeposit
              )
          );
          if (dIndex > -1) {
            // Match found!
            const deposit = deposits.splice(
              dIndex,
              1
            )[0] as unknown as AggregatedDeposit;
            aggregatedPayments[pindex].status = MatchStatus.MATCH;
            aggregatedPayments[pindex].payments = aggregatedPayments[
              pindex
            ].payments.map((itm) => ({
              ...itm,
              status: MatchStatus.MATCH,
              timestamp: itm.timestamp,
            }));
            matches.push({
              payments: payment.payments.map((itm: PaymentEntity) => ({
                ...itm,
                status: MatchStatus.MATCH,
                timestamp: itm.timestamp,
                heuristic_match_round: posHeuristicRound,
                round_four_matches: deposit.deposits,
              })),
              deposits: deposit.deposits.map((itm) => ({
                ...itm,
                status: MatchStatus.MATCH,
                timestamp: itm.timestamp,
                heuristic_match_round: posHeuristicRound,
              })),
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
   * check the payment and deposit are the same method
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
   * date/time match on first three heuristic rounds
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
   * Check the required fields for a round four match
   * @param payment
   * @param deposit
   * @returns
   */
  public verifyRoundFour(
    payment: AggregatedPosPayment,
    deposit: AggregatedDeposit
  ): boolean {
    return (
      payment.transaction.transaction_date === deposit.transaction_date &&
      payment.payment_method.method === deposit.payment_method.method &&
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
    );
  }
  /**
   * Set the exceptions for a given location and date
   * @param location
   * @param program
   * @param date
   * @returns
   */
  public async setExceptions(
    location: NormalizedLocation,
    program: Ministries,
    date: string
  ): Promise<unknown> {
    this.appLogger.log(
      `Exceptions POS: ${date} - ${location.description} - ${location.location_id}`,
      PosReconciliationService.name
    );

    const inProgressPayments =
      await this.paymentService.findPosPaymentExceptions(
        date,
        location.location_id
      );

    const inProgressDeposits =
      await this.posDepositService.findPOSDepositsExceptions(
        date,
        location.merchant_ids,
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
  /**
   * Aggregate payments by date and payment method for heuristic round four
   * @param payments
   * @returns
   */
  public aggregatePayments(payments: PaymentEntity[]): AggregatedPosPayment[] {
    const aggPayments = payments.reduce(
      (acc: { [key: string]: AggregatedPosPayment }, itm: PaymentEntity) => {
        const key = `${itm.transaction.transaction_date}-${itm.payment_method.method}`;
        if (!acc[key]) {
          acc[key] = {
            transaction: {
              transaction_date: itm.transaction.transaction_date,
            },
            amount: 0,
            status: itm.status,
            payment_method: itm.payment_method,
            heuristic_match_round: undefined,
            round_four_matches: [],
            payments: [],
          };
        }
        acc[key].amount += itm.amount;
        acc[key].payments.push(itm);

        return acc;
      },
      {}
    );

    const aggregatedPayments: AggregatedPosPayment[] =
      Object.values(aggPayments);

    return aggregatedPayments.sort(
      (a: AggregatedPosPayment, b: AggregatedPosPayment) => a.amount - b.amount
    );
  }
  /**
   * Aggregate deposits by date and method for heuristic round four
   * @param deposits
   * @returns
   */
  public aggregateDeposits(deposits: POSDepositEntity[]): AggregatedDeposit[] {
    const aggDeposits = deposits.reduce(
      (acc: { [key: string]: AggregatedDeposit }, itm: POSDepositEntity) => {
        const key = `${itm.transaction_date}-${itm.payment_method.method}`;
        if (!acc[key]) {
          acc[key] = {
            transaction_amt: 0,
            payment_method: itm.payment_method,
            status: itm.status,
            transaction_date: itm.transaction_date,
            heuristic_match_round: undefined,
            deposits: [],
          };
        }
        acc[key].transaction_amt += itm.transaction_amt;
        acc[key].deposits.push(itm);
        return acc;
      },
      {}
    );

    const aggregatedDeposits: AggregatedDeposit[] = Object.values(aggDeposits);

    return aggregatedDeposits.sort(
      (a: AggregatedDeposit, b: AggregatedDeposit) =>
        a.transaction_amt - b.transaction_amt
    );
  }
}
