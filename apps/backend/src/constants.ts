import Decimal from 'decimal.js';
import { MatchStatus } from './common/const';
import { POSDepositEntity } from './deposits/entities/pos-deposit.entity';
import { TDI17Header } from './flat-files/tdi17/TDI17Header';
import { TDI34Header } from './flat-files/tdi34/TDI34Header';
import { FileIngestionRulesEntity } from './notification/entities/file-ingestion-rules.entity';
import { PosHeuristicRound } from './reconciliation/types';
import { PaymentEntity, PaymentMethodEntity } from './transaction/entities';

enum FileExtensions {
  DAT = 'DAT',
  JSON = 'JSON',
}

export const ALL = 'all';

export enum Ministries {
  SBC = 'SBC',
  LABOUR = 'LABOUR',
}
export enum DataSource {
  SBC = 'sbc',
  BCM = 'bcm',
}

export enum FileTypes {
  TDI17 = 'TDI17',
  TDI34 = 'TDI34',
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

export const BankMerchantId = 999999999;

export const SUPPORTED_FILE_EXTENSIONS: {
  [key: string]: string[];
} = {
  [FileTypes.TDI17]: [FileExtensions.DAT],
  [FileTypes.TDI34]: [FileExtensions.DAT],
  [FileTypes.SBC_SALES]: [FileExtensions.JSON],
};

export interface S3File {
  contents: Buffer;
  filename: string;
  fileType: FileTypes;
  programRule: FileIngestionRulesEntity;
}
