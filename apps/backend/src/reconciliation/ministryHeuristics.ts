import { differenceInMinutes } from 'date-fns';
import Decimal from 'decimal.js';
import { Heuristics, PosHeuristicRound } from './types';
import { MatchStatus } from '../common/const';
import { Ministries } from '../constants';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../transaction/entities';

export const heuristics: { [key: string]: Heuristics[] } = {
  [Ministries.SBC]: [
    {
      name: PosHeuristicRound.ONE,
      nextRound: PosHeuristicRound.TWO,
      checkMatch: (payment: PaymentEntity, deposit: POSDepositEntity) => {
        return (
          payment.status !== MatchStatus.MATCH &&
          deposit.status !== MatchStatus.MATCH &&
          new Decimal(
            payment.amount > 0 ? payment.amount : payment.amount * -1
          ).sub(
            new Decimal(
              deposit.transaction_amt > 0
                ? deposit.transaction_amt
                : deposit.transaction_amt * -1
            )
          ) === new Decimal(0) &&
          Math.abs(differenceInMinutes(payment.timestamp, deposit.timestamp)) <=
            5
        );
      },
    },

    {
      name: PosHeuristicRound.TWO,
      nextRound: PosHeuristicRound.THREE,
      checkMatch: (payment: PaymentEntity, deposit: POSDepositEntity) => {
        return (
          payment.status !== MatchStatus.MATCH &&
          deposit.status !== MatchStatus.MATCH &&
          new Decimal(
            payment.amount > 0 ? payment.amount : payment.amount * -1
          ).sub(
            new Decimal(
              deposit.transaction_amt > 0
                ? deposit.transaction_amt
                : deposit.transaction_amt * -1
            )
          ) === new Decimal(0)
        );
      },
    },
    {
      name: PosHeuristicRound.THREE,
      nextRound: PosHeuristicRound.FOUR,
      checkMatch: (payment: PaymentEntity, deposit: POSDepositEntity) => {
        return (
          deposit.status !== MatchStatus.MATCH &&
          payment.status !== MatchStatus.MATCH &&
          new Decimal(
            payment.amount > 0 ? payment.amount : payment.amount * -1
          ).sub(
            new Decimal(
              deposit.transaction_amt > 0
                ? deposit.transaction_amt
                : deposit.transaction_amt * -1
            )
          ) === new Decimal(0)
        );
      },
    },
    {
      name: PosHeuristicRound.FOUR,
      nextRound: null,
      checkMatch: (payment_amount: number, deposit_amount: number) => {
        return payment_amount === deposit_amount;
      },
    },
  ],
};
