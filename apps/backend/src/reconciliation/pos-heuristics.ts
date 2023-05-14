import { Injectable } from '@nestjs/common';
import { differenceInBusinessDays, differenceInMinutes } from 'date-fns';
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

  public roundOneHeuristics(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyStatus(payment, deposit) &&
      this.verifyTimeMatch(payment, deposit, 5)
    );
  }

  public roundTwoHeuristics(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyStatus(payment, deposit) &&
      this.verifyTimeMatch(payment, deposit, 1440)
    );
  }

  public roundThreeHeuristics(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): boolean {
    return (
      this.verifyMethod(payment, deposit) &&
      this.verifyAmount(payment, deposit) &&
      this.verifyStatus(payment, deposit) &&
      this.lookBackOneBusinessDay(payment, deposit)
    );
  }

  public isMatch(
    payment: PaymentEntity,
    deposit: POSDepositEntity,
    round: number
  ): boolean {
    switch (round) {
      case 1:
        return this.roundOneHeuristics(payment, deposit);
      case 2:
        return this.roundTwoHeuristics(payment, deposit);
      case 3:
        return this.roundThreeHeuristics(payment, deposit);
      default:
        return this.roundOneHeuristics(payment, deposit);
    }
  }
}
