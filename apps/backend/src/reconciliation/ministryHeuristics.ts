import { differenceInSeconds } from 'date-fns';
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
        if (
          payment.status !== MatchStatus.PENDING &&
          deposit.status !== MatchStatus.PENDING
        ) {
          return (
            payment.amount === deposit.transaction_amt &&
            differenceInSeconds(payment.timestamp, deposit.timestamp) < 240
          );
        }
      },
    },

    {
      name: PosHeuristicRound.TWO,
      nextRound: PosHeuristicRound.THREE,
      checkMatch: (payment: PaymentEntity, deposit: POSDepositEntity) => {
        if (
          payment.status === MatchStatus.PENDING &&
          deposit.status === MatchStatus.PENDING
        ) {
          return payment.amount === deposit.transaction_amt;
        }
      },
    },

    {
      name: PosHeuristicRound.THREE,
      nextRound: PosHeuristicRound.FOUR,
      checkMatch: (payment: PaymentEntity, deposit: POSDepositEntity) => {
        if (
          payment.status !== MatchStatus.MATCH &&
          deposit.status === MatchStatus.IN_PROGRESS
        ) {
          return payment.amount === deposit.transaction_amt;
        }
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
