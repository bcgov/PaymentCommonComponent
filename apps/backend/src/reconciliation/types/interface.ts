import Decimal from 'decimal.js';
import { PosHeuristicRound, ReconciliationType } from './const';
import { MatchStatus } from '../../common/const';
import {
  DateRange,
  Ministries,
  NormalizedLocation,
  PaymentMethodClassification,
} from '../../constants';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../../location/entities';
import { PaymentEntity } from '../../transaction/entities';

export interface PosPaymentPosDepositPair {
  payment: PaymentEntity;
  deposit: POSDepositEntity;
}

export interface PosExceptions {
  paymentExceptions: PaymentEntity[] | [];
  depositExceptions: POSDepositEntity[] | [];
}

export interface ReconciliationConfig {
  location: LocationEntity;
  program: Ministries;
  dateRange?: DateRange;
  date: string;
}

export interface ReconciliationError {
  message: string;
}

export interface AggregatedCashPayment {
  status: MatchStatus;
  fiscal_close_date: string;
  location_id: number;
  amount: Decimal;
  classification: PaymentMethodClassification;
  cash_deposit_match?: CashDepositEntity;
  payments: PaymentEntity[];
}

export interface PosDepositsAmountDictionary {
  [key: string]: PosDepositDictionary;
}

export interface PosDepositDictionary {
  [key: string]: {
    date: string;
    method: string;
    deposit_amount: Decimal;
    deposits: POSDepositEntity[];
  };
}

export interface PaymentDictionary {
  [key: string]: {
    date: string;
    method: string;
    payment_amount: Decimal;
    payments: PaymentEntity[];
  };
}

export interface ReconcileEvent {
  locations: NormalizedLocation[];
  reconciliationMaxDate: string;
  program: Ministries;
  payments: PaymentEntity[];
}

export interface UnMatched {
  unmatchedPayments: PaymentEntity[];
  unmatchedDeposits: POSDepositEntity[];
}
export interface ReconciliationResults {
  type: ReconciliationType;
  location_id: number;
  total_deposits_pending: number;
  total_payments_pending: number;
  total_matched_payments: number;
  total_matched_deposits: number;
  total_payments_in_progress: number;
  total_deposits_in_progress: number;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Dictionary {
  [key: string]: any;
}

export interface Heuristics {
  name: PosHeuristicRound;
  nextRound: PosHeuristicRound | null;
  checkMatch: (...args: any) => any;
}
