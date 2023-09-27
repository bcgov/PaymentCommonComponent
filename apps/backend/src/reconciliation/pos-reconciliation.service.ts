import { Inject, Injectable } from '@nestjs/common';
import { format, parse, subBusinessDays } from 'date-fns';
import Decimal from 'decimal.js';

import {
  Dictionary,
  PaymentDictionary,
  PosHeuristicRound,
  PosDepositDictionary,
  ReconciliationType,
  UnMatched,
  ReconciliationResults,
  ReconciliationError,
  Heuristics,
} from './types';
import { MatchStatus } from '../common/const';
import { Ministries, NormalizedLocation } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { AppLogger } from '../logger/logger.service';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { PaymentService } from '../transaction/payment.service';

/**
 * @description Reconciliation Service for matching POS payments to POS deposits
 * @class
 *
 */
@Injectable()
export class PosReconciliationService {
  public heuristics: Heuristics[];
  public heuristicMatchRound: Heuristics;
  public matchedPayments: PaymentEntity[];
  public matchedDeposits: POSDepositEntity[];
  public pendingPayments: PaymentEntity[];
  public pendingDeposits: POSDepositEntity[];

  /**
   * @constructor
   * @param appLogger
   * @param posDepositService
   * @param paymentService
   */

  constructor(
    @Inject(PosDepositService) private depositService: PosDepositService,
    @Inject(PaymentService) private paymentService: PaymentService,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(PosReconciliationService.name);
  }

  setHeuristics(heuristics: Heuristics[]): void {
    this.heuristics = heuristics;
  }
  setHeuristicMatchRound(round: Heuristics): void {
    this.heuristicMatchRound = round;
  }
  setMatchedPayments(payments: PaymentEntity[]): void {
    this.matchedPayments = payments;
  }
  setMatchedDeposits(deposits: POSDepositEntity[]): void {
    this.matchedDeposits = deposits;
  }
  setPendingPayments(payments: PaymentEntity[]): void {
    this.pendingPayments = payments;
  }
  setPendingDeposits(deposits: POSDepositEntity[]): void {
    this.pendingDeposits = deposits;
  }

  /**
   * Match POS payments to POS deposits on location, program, date and time based heuristics
   * @param {LocationEntity} location
   * @param {Ministries} program
   * @param {Date} date
   * @returns {Promise<ReconciliationResults>}
   */

  public async reconcile(
    location: NormalizedLocation,
    program: Ministries
  ): Promise<ReconciliationResults | ReconciliationError> {
    if (
      this.pendingPayments?.length === 0 ||
      this.pendingDeposits?.length === 0
    ) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    this.appLogger.log(`Payments Pending: ${this.pendingPayments?.length}`);
    this.appLogger.log(`Deposits Pending: ${this.pendingDeposits?.length}`);

    this.appLogger.log(`Reconciling POS for: ${location.description}`);

    const { unmatchedPayments, unmatchedDeposits } = this.filterAndSetMatch(
      this.pendingPayments,
      this.pendingDeposits
    );

    if (
      unmatchedPayments.length + this.matchedPayments.length !==
      this.pendingPayments.length
    ) {
      throw new Error('Unmatched payments do not match pending payments');
    }

    if (
      unmatchedDeposits.length + this.matchedDeposits.length !==
      this.pendingDeposits.length
    ) {
      throw new Error('Unmatched deposits do not match pending deposits');
    }

    const paymentMatches = await this.paymentService.updatePayments(
      this.matchedPayments ?? []
    );

    const depositMatches = await this.depositService.updateDeposits(
      this.matchedDeposits ?? []
    );

    if (paymentMatches.length !== this.matchedPayments.length) {
      throw new Error('Error updating matched payments');
    }
    if (depositMatches.length !== this.matchedDeposits.length) {
      throw new Error('Error updating matched deposits');
    }

    const paymentsInProgress = await this.paymentService.updatePayments(
      unmatchedPayments ?? []
    );
    const depositsInProgress = await this.depositService.updateDeposits(
      unmatchedDeposits
        .filter((itm: POSDepositEntity) => itm?.status === MatchStatus.PENDING)
        .map((itm: POSDepositEntity) => ({
          ...itm,
          in_progress_on: new Date(),
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
    );

    await this.setExceptions(
      location,
      program,
      format(subBusinessDays(new Date(), 2), 'yyyy-MM-dd'),
      new Date()
    );

    return {
      type: ReconciliationType.POS,
      location_id: location.location_id,
      total_deposits_pending: this.pendingDeposits.length,
      total_payments_pending: this.pendingPayments.length,
      total_matched_payments: paymentMatches.length,
      total_matched_deposits: depositMatches.length,
      total_payments_in_progress: paymentsInProgress.length,
      total_deposits_in_progress: depositsInProgress.length,
    };
  }

  public filterAndSetMatch(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): UnMatched {
    this.appLogger.log(`Match Round: ${this.heuristicMatchRound.name}`);

    this.appLogger.log(`Payments to be matched: ${payments.length}`);
    this.appLogger.log(`Deposits to be matched: ${deposits.length}`);

    const prevMatchedPaymentsCount = this.matchedPayments.length;
    const prevMatchedDepositsCount = this.matchedDeposits.length;

    const { unmatchedPayments, unmatchedDeposits } =
      this.findMatchesInDictionary(this.buildDictionaries(payments, deposits));

    this.appLogger.log(
      `Matched Payments round ${this.heuristicMatchRound.name}: ${
        this.matchedPayments.length - prevMatchedPaymentsCount
      }`
    );
    this.appLogger.log(
      `Matched Deposits round ${this.heuristicMatchRound.name}: ${
        this.matchedDeposits.length - prevMatchedDepositsCount
      }`
    );
    this.appLogger.log(
      `Remaining Unmatched Payments: ${unmatchedPayments.length}`
    );
    this.appLogger.log(
      `Remaining Unmatched Deposits: ${unmatchedDeposits.length}`
    );

    if (this.heuristicMatchRound.name === PosHeuristicRound.FOUR) {
      return {
        unmatchedDeposits,
        unmatchedPayments,
      };
    }

    this.heuristicMatchRound =
      this.heuristics[this.heuristics.indexOf(this.heuristicMatchRound) + 1];

    return this.filterAndSetMatch(unmatchedPayments, unmatchedDeposits);
  }
  public findMatchesInDictionary(
    methodAndDateDictionaries: Dictionary[]
  ): UnMatched {
    methodAndDateDictionaries.forEach((itm: Dictionary, index: number) => {
      if (
        this.heuristicMatchRound.name === PosHeuristicRound.FOUR &&
        this.heuristicMatchRound.checkMatch(
          itm.payment_amount,
          itm.deposit_amount
        )
      ) {
        methodAndDateDictionaries[index].payments = itm?.payments?.map(
          (payment: PaymentEntity) => ({
            ...payment,
            status: MatchStatus.MATCH,
            heuristic_match_round: this.heuristicMatchRound.name,
            reconciled_on: new Date(),
            round_four_matches: itm.deposits,
          })
        );
        methodAndDateDictionaries[index].deposits = itm?.deposits?.map(
          (deposit: POSDepositEntity) => ({
            ...deposit,
            status: MatchStatus.MATCH,
            heuristic_match_round: this.heuristicMatchRound.name,
            reconciled_on: new Date(),
            round_four_matches: itm.payments,
          })
        );
      } else {
        itm.payments?.forEach((payment: PaymentEntity, pindex: number) => {
          const deposit = itm?.deposits?.find((deposit: POSDepositEntity) =>
            this.heuristicMatchRound.checkMatch(payment, deposit)
          );
          if (deposit) {
            methodAndDateDictionaries[index].payments[pindex] = {
              ...payment,
              status: MatchStatus.MATCH,
              heuristic_match_round: this.heuristicMatchRound.name,
              reconciled_on: new Date(),
              pos_deposit_match: deposit,
            };

            methodAndDateDictionaries[index].deposits[
              methodAndDateDictionaries[index]?.deposits.indexOf(deposit)
            ] = {
              ...deposit,
              status: MatchStatus.MATCH,
              heuristic_match_round: this.heuristicMatchRound.name,
              reconciled_on: new Date(),
            };
          }
        });
      }
    });

    const payments = methodAndDateDictionaries
      .flatMap(
        (itm: Dictionary) =>
          itm?.payments?.filter((itm: PaymentEntity) => itm !== undefined)
      )
      ?.filter((itm) => itm);

    const deposits = methodAndDateDictionaries
      .flatMap(
        (itm: Dictionary) =>
          itm?.deposits?.filter((itm: POSDepositEntity) => itm !== undefined)
      )
      ?.filter((itm) => itm);
    const matchedPayments =
      payments.filter(
        (itm: PaymentEntity) => itm?.status === MatchStatus.MATCH
      ) ?? [];

    this.matchedPayments.push(...matchedPayments);

    const matchedDeposits =
      deposits.filter(
        (itm: POSDepositEntity) => itm?.status === MatchStatus.MATCH
      ) ?? [];

    this.matchedDeposits.push(...matchedDeposits);
    return {
      unmatchedPayments:
        payments?.filter(
          (itm: PaymentEntity) => itm?.status !== MatchStatus.MATCH
        ) ?? [],
      unmatchedDeposits:
        deposits?.filter(
          (itm: POSDepositEntity) => itm?.status !== MatchStatus.MATCH
        ) ?? [],
    };
  }
  /**
   * Build a dictionary of payments and deposits based on the round
   * @param payments
   * @param deposits
   * @param round
   * @returns
   */
  public buildDictionaries(
    payments: PaymentEntity[],
    deposits: POSDepositEntity[]
  ): Dictionary[] {
    const paymentDictionary = this.paymentDictionary(payments);
    const depositDictionary = this.depositDictionary(
      deposits,
      this.heuristicMatchRound.name
    );

    const keys = Array.from(
      new Set([
        ...Object.keys(paymentDictionary),
        ...Object.keys(depositDictionary),
      ])
    );

    return keys?.map((itm) => ({
      ...paymentDictionary[itm],
      ...depositDictionary[itm],
    }));
  }

  /**
   * Create a dictionary of the payments
   * @param payments
   * @returns
   */
  public paymentDictionary(payments: PaymentEntity[]): Dictionary {
    return payments.reduce((acc: PaymentDictionary, itm: PaymentEntity) => {
      const key = `${itm?.transaction?.transaction_date}-${itm?.payment_method?.method}`;
      if (!acc[key]) {
        acc[key] = {
          date: itm?.transaction?.transaction_date,
          method: itm?.payment_method?.method,
          payment_amount: 0,
          payments: [],
        };
      }
      acc[key].payment_amount = new Decimal(acc[key].payment_amount)
        .plus(new Decimal(itm?.amount ?? 0))
        .toNumber();
      acc[key].payments.push(itm);

      return acc;
    }, {});
  }
  /**
   * Create a dictionary of the deposits
   * @param deposits
   * @param round
   * @returns
   */
  public depositDictionary(
    deposits: POSDepositEntity[],
    round: PosHeuristicRound
  ): Dictionary {
    return deposits.reduce(
      (acc: PosDepositDictionary, itm: POSDepositEntity) => {
        const dateKey =
          round === PosHeuristicRound.THREE
            ? format(
                subBusinessDays(
                  parse(itm.transaction_date, 'yyyy-MM-dd', new Date()),
                  1
                ),
                'yyyy-MM-dd'
              )
            : itm.transaction_date;
        const key = `${dateKey}-${itm?.payment_method?.method}`;
        if (!acc[key]) {
          acc[key] = {
            date: dateKey,
            method: itm?.payment_method?.method,
            deposit_amount: 0,
            deposits: [],
          };
        }
        acc[key].deposit_amount = new Decimal(acc[key].deposit_amount)
          .plus(new Decimal(itm.transaction_amt))
          .toNumber();
        acc[key].deposits.push(itm);

        return acc;
      },
      {}
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
    exceptionsDate: string,
    currentDate: Date
  ): Promise<unknown> {
    this.appLogger.log(
      `Exceptions POS: ${exceptionsDate} - ${location.description} - ${location.location_id}`
    );

    const inProgressPayments =
      await this.paymentService.findPosPaymentExceptions(
        exceptionsDate,
        location.location_id
      );

    const inProgressDeposits =
      await this.depositService.findPOSDepositsExceptions(
        exceptionsDate,
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
      reconciled_on: currentDate,
      status: MatchStatus.EXCEPTION,
    }));
    const paymentExceptions = await this.paymentService.updatePayments(
      updatedPayments // TO EXCEPTION
    );

    const updatedDeposits = inProgressDeposits.map((itm: POSDepositEntity) => ({
      ...itm,
      timestamp: itm.timestamp,
      reconciled_on: currentDate,
      status: MatchStatus.EXCEPTION,
    }));

    const depositExceptions = await this.depositService.updateDepositStatus(
      updatedDeposits // TO EXCEPTION
    );

    return {
      depositExceptions: depositExceptions.length,
      paymentExceptions: paymentExceptions.length,
    };
  }
}
