import { MatchStatus } from './common/const';
import { POSDepositEntity } from './deposits/entities/pos-deposit.entity';
import { PosHeuristicRound } from './reconciliation/types';
import { PaymentEntity, PaymentMethodEntity } from './transaction/entities';

export const ALL = 'all';

export enum Ministries {
  SBC = 'SBC',
  LABOUR = 'LABOUR',
}

export enum FileTypes {
  TDI17 = 'TDI17',
  TDI34 = 'TDI34',
  DDF = 'DDF',
  SBC_SALES = 'SBC_SALES',
}

export enum FileNames {
  TDI17 = 'F08TDI17',
  TDI34 = 'F08TDI34',
  SBC_SALES = 'SBC_SALES',
}

export interface ParseArgsTDI {
  type: FileTypes;
  fileName: string;
  program: string;
  fileContents: string;
}

export interface DateRange {
  minDate: string;
  maxDate: string;
}

export enum PaymentMethodClassification {
  CASH = 'CASH',
  POS = 'POS',
  IGNORE = 'IGNORE',
}

export interface AggregatedDeposit {
  transaction_amt: number;
  transaction_date: string;
  timestamp: Date;
  status: MatchStatus;
  heuristic_match_round: PosHeuristicRound;
  payment_method: PaymentMethodEntity;
  deposits: POSDepositEntity[];
}

export interface AggregatedPosPayment {
  transaction: {
    transaction_date: string;
  };
  amount: number;
  status: MatchStatus;
  timestamp: Date;
  heuristic_match_round: PosHeuristicRound;
  round_four_deposits: POSDepositEntity[];
  payment_method: PaymentMethodEntity;
  payments: PaymentEntity[];
}
