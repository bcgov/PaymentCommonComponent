import { Injectable } from '@nestjs/common';
import { differenceInBusinessDays, differenceInMinutes } from 'date-fns';
import { PosHeuristicRound } from './types';
import { MatchStatus } from '../common/const';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../transaction/entities/payment.entity';
/**
 * @class
 * @description This class contains the heuristics rounds for matching a payment to a deposit.
 */
@Injectable()
export class PosMatchHeuristics {
  /**
   * Match payment to deposit on the same payment method
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolen}
   */
  public verifySamePaymentMethod(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.payment_method.method === deposit.payment_method.method;
  }
  /**
   * Match payment to deposit on the same amount
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolen}
   */
  public verifySameAmount(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.amount === deposit.transaction_amt;
  }
  /**
   * Only match if payment and deposit are not already matched
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolen}
   */
  public verifyStatusNotMatched(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
    );
  }
  /**
   * Check minimum match requirements for each heuristic round
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @returns {boolean}
   */
  public verifyMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      this.verifySamePaymentMethod(payment, deposit) &&
      this.verifySameAmount(payment, deposit) &&
      this.verifyStatusNotMatched(payment, deposit)
    );
  }
  /**
   * Check if payment and deposit match based on the passed param for the heuristic round
   * @param {PaymentEntity} payment
   * @param {POSDepositEntity} deposit
   * @param {PosHeuristicRound} round
   * @returns {boolean}
   */
  public isMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    round: PosHeuristicRound
  ): boolean {
    switch (round) {
      case PosHeuristicRound.ONE:
        return (
          this.verifyMatch(payment, deposit) &&
          /** Round one - nearly 1:1 time match */
          differenceInMinutes(payment.timestamp, deposit.timestamp) <= 5
        );
      case PosHeuristicRound.TWO:
        return (
          this.verifyMatch(payment, deposit) &&
          /** Round two - no time match - match by same day */
          payment.transaction.transaction_date === deposit.transaction_date
        );
      case PosHeuristicRound.THREE:
        return (
          this.verifyMatch(payment, deposit) &&
          /** Round three - look back one business day */
          differenceInBusinessDays(payment.timestamp, deposit.timestamp) <= 1
        );
      default:
        return false;
    }
  }
}
