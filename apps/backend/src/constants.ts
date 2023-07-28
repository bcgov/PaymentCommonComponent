import Decimal from 'decimal.js';
import { MatchStatus } from './common/const';
import { POSDepositEntity } from './deposits/entities/pos-deposit.entity';
import { TDI17Header } from './flat-files/tdi17/TDI17Header';
import { TDI34Header } from './flat-files/tdi34/TDI34Header';
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
  header: TDI17Header | TDI34Header;
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
  transaction_amt: Decimal;
  transaction_date: string;
  status: MatchStatus;
  heuristic_match_round?: PosHeuristicRound;
  payment_method: PaymentMethodEntity;
  deposits: POSDepositEntity[];
}

export interface AggregatedPosPayment {
  transaction: {
    transaction_date: string;
  };
  amount: Decimal;
  status: MatchStatus;
  heuristic_match_round?: PosHeuristicRound;
  round_four_matches: POSDepositEntity[];
  payment_method: PaymentMethodEntity;
  payments: PaymentEntity[];
}

export interface NormalizedLocation {
  location_id: number;
  source_id: string;
  program_code: number;
  ministry_client: number;
  resp_code: string;
  service_line_code: number;
  stob_code: number;
  project_code: number;
  description: string;
  merchant_ids: number[];
  pt_location_id: number;
}

export const BankMerchantId = 999999999;
