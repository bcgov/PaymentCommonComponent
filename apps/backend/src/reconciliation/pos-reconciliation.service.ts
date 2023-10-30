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
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import { MinistryLocationEntity } from '../location/entities';
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
  public reconciliationDate: Date;
  public exceptionsDate: Date;
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

  setReconciliationDate(maxDate: string): void {
    this.reconciliationDate = parse(maxDate, 'yyyy-MM-dd', new Date());
  }
  setExceptionsDate(maxDate: string): void {
    this.exceptionsDate = subBusinessDays(
      parse(maxDate, 'yyyy-MM-dd', new Date()),
      2
    );
  }

  setHeuristics(heuristics: Heuristics[]): void {
    this.heuristics = heuristics;
  }
  setHeuristicMatchRound(round: Heuristics): void {
    this.heuristicMatchRound = round;
  }
  setPendingPayments(payments: PaymentEntity[]): void {
    this.pendingPayments = payments;
  }
  setPendingDeposits(deposits: POSDepositEntity[]): void {
    this.pendingDeposits = deposits;
  }
  setMatchedPayments(payments: PaymentEntity[]): void {
    this.matchedPayments = payments;
  }
  setMatchedDeposits(deposits: POSDepositEntity[]): void {
    this.matchedDeposits = deposits;
  }

  /**
   * Match POS payments to POS deposits on location, program, date and time based heuristics
   * @param {MasterLocationEntity} location
   * @param {Ministries} program
   * @param {Date} date
   * @returns {Promise<ReconciliationResults>}
   */

  public async reconcile(
    location: MinistryLocationEntity
  ): Promise<ReconciliationResults | ReconciliationError> {
    if (
      this.pendingPayments?.length === 0 ||
      this.pendingDeposits?.length === 0
    ) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    this.appLogger.log(`Reconciling POS for: ${location.description}`);

    this.appLogger.log(`Payments Pending: ${this.pendingPayments?.length}`);
    this.appLogger.log(`Deposits Pending: ${this.pendingDeposits?.length}`);

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
      unmatchedPayments
        .filter((itm: PaymentEntity) => itm?.status === MatchStatus.PENDING)
        .map((itm: PaymentEntity) => ({
          ...itm,
          in_progress_on: this.reconciliationDate,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
    );

    const depositsInProgress = await this.depositService.updateDeposits(
      unmatchedDeposits
        .filter((itm: POSDepositEntity) => itm?.status === MatchStatus.PENDING)
        .map((itm: POSDepositEntity) => ({
          ...itm,
          in_progress_on: this.reconciliationDate,
          timestamp: itm.timestamp,
          status: MatchStatus.IN_PROGRESS,
        }))
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
      if (this.heuristicMatchRound.name === PosHeuristicRound.FOUR) {
        if (
          this.heuristicMatchRound.checkMatch(
            itm.payment_amount ?? new Decimal(0),
            itm.deposit_amount ?? new Decimal(0)
          )
        ) {
          methodAndDateDictionaries[index].payments = itm?.payments?.map(
            (payment: PaymentEntity) => ({
              ...payment,
              status: MatchStatus.MATCH,
              heuristic_match_round: this.heuristicMatchRound.name,
              reconciled_on: this.reconciliationDate,
              round_four_matches: itm.deposits,
            })
          );
          methodAndDateDictionaries[index].deposits = itm?.deposits?.map(
            (deposit: POSDepositEntity) => ({
              ...deposit,
              status: MatchStatus.MATCH,
              heuristic_match_round: this.heuristicMatchRound.name,
              reconciled_on: this.reconciliationDate,
              round_four_matches: itm.payments,
            })
          );
        }
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
              reconciled_on: this.reconciliationDate,
              pos_deposit_match: deposit,
            };

            methodAndDateDictionaries[index].deposits[
              methodAndDateDictionaries[index]?.deposits.indexOf(deposit)
            ] = {
              ...deposit,
              status: MatchStatus.MATCH,
              heuristic_match_round: this.heuristicMatchRound.name,
              reconciled_on: this.reconciliationDate,
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
    const depositDictionary = this.depositDictionary(deposits);

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
      const dateKey =
        this.heuristicMatchRound.name === PosHeuristicRound.THREE
          ? format(
              subBusinessDays(
                parse(
                  itm?.transaction?.transaction_date,
                  'yyyy-MM-dd',
                  new Date()
                ),
                1
              ),
              'yyyy-MM-dd'
            )
          : itm?.transaction?.transaction_date;
      const key = `${dateKey}-${itm?.payment_method?.method}`;
      if (!acc[key]) {
        acc[key] = {
          date: dateKey,
          method: itm?.payment_method?.method,
          payment_amount: new Decimal(0),
          payments: [],
        };
      }
      acc[key].payment_amount = new Decimal(acc[key].payment_amount).plus(
        new Decimal(itm?.amount ?? 0)
      );

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
  public depositDictionary(deposits: POSDepositEntity[]): Dictionary {
    return deposits.reduce(
      (acc: PosDepositDictionary, itm: POSDepositEntity) => {
        const dateKey = itm.transaction_date;
        const key = `${dateKey}-${itm?.payment_method?.method}`;
        if (!acc[key]) {
          acc[key] = {
            date: dateKey,
            method: itm?.payment_method?.method,
            deposit_amount: new Decimal(0),
            deposits: [],
          };
        }
        acc[key].deposit_amount = new Decimal(acc[key].deposit_amount).plus(
          new Decimal(itm.transaction_amt)
        );
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
  public async setExceptions(): Promise<unknown> {
    if (
      this.pendingPayments.length === 0 &&
      this.pendingDeposits.length === 0
    ) {
      return {
        message: 'No pending payments or deposits found',
      };
    }

    const updatedPayments = this.pendingPayments.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      reconciled_on: this.reconciliationDate,
      status: MatchStatus.EXCEPTION,
    }));
    const paymentExceptions = await this.paymentService.updatePayments(
      updatedPayments // TO EXCEPTION
    );

    const updatedDeposits = this.pendingDeposits.map(
      (itm: POSDepositEntity) => ({
        ...itm,
        timestamp: itm.timestamp,
        reconciled_on: this.reconciliationDate,
        status: MatchStatus.EXCEPTION,
      })
    );

    const depositExceptions = await this.depositService.updateDepositStatus(
      updatedDeposits // TO EXCEPTION
    );

    return {
      depositExceptions: depositExceptions.length,
      paymentExceptions: paymentExceptions.length,
    };
  }
}
