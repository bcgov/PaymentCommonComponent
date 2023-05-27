import { POSDepositEntity } from './deposits/entities/pos-deposit.entity';
import { PaymentEntity } from './transaction/entities';

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

export interface AggregatedDeposit extends POSDepositEntity {
  deposits: POSDepositEntity[];
}

export interface AggregatedPosPayment extends PaymentEntity {
  transaction_date: string;
  payments: PaymentEntity[];
}
