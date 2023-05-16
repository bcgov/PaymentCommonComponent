import { Injectable } from '@nestjs/common';
import { differenceInBusinessDays, differenceInMinutes } from 'date-fns';
import { PosHeuristicRound, PosTimeMatch } from './types';
import { MatchStatus } from '../common/const';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../transaction/entities/payment.entity';

@Injectable()
export class PosMatchHeuristics {
  public verifyTimeMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    timeDiff: number
  ): boolean {
    return differenceInMinutes(payment.timestamp, deposit.timestamp) < timeDiff;
  }

  public lookBackOneBusinessDay(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return differenceInBusinessDays(payment.timestamp, deposit.timestamp) <= 2;
  }

  public verifyMethod(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.payment_method.method === deposit.payment_method.method;
  }

  public verifyAmount(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return payment.amount === deposit.transaction_amt;
  }

  public verifyStatus(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      payment.status !== MatchStatus.MATCH &&
      deposit.status !== MatchStatus.MATCH
    );
  }
  public verifyMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyStatus(payment, deposit)
    );
  }

  public isMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    round: PosHeuristicRound
  ): boolean {
    switch (round) {
      case PosHeuristicRound.TWO:
        return (
          this.verifyMatch(payment, deposit) &&
          this.verifyTimeMatch(payment, deposit, PosTimeMatch.ROUND_TWO)
        );
      case PosHeuristicRound.ONE:
        return (
          this.verifyMatch(payment, deposit) &&
          this.verifyTimeMatch(payment, deposit, PosTimeMatch.ROUND_ONE)
        );
      case PosHeuristicRound.THREE:
        return (
          this.verifyMatch(payment, deposit) &&
          this.lookBackOneBusinessDay(payment, deposit)
        );
      default:
        return false;
    }
  }
}
