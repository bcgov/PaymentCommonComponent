import { ReconciliationType } from './const';
import { MatchStatus } from '../../common/const';
import { Ministries } from '../../constants';
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

export interface CashDepositDates {
  current?: string;
  pastDue?: string;
  previous?: string;
  first?: string;
}

export interface ReconciliationEvent {
  date?: string;
  location: LocationEntity;
  program: string;
  fiscal_start_date?: string;
  fiscal_close_date?: string;
}

export interface ReconciliationEventInput {
  fiscal_start_date: string;
  fiscal_close_date: string;
  location_ids: number[];
  program: Ministries;
}

export interface ReconciliationEventError {
  error: string;
}

export interface ReconciliationEventOutput {
  total_deposit: number;
  total_payments: number;
  total_matched?: number;
  matched?: unknown[];
}
export interface AggregatedPayment {
  status: MatchStatus;
  fiscal_close_date: string;
  location_id: number;
  amount: number;
  deposit_id: CashDepositEntity;
  payments: PaymentEntity[];
}
export interface GroupedPaymentsAndDeposits {
  location_id: number;
  location_name: string;
  deposit_date: string;
  status: MatchStatus;
  fiscal_close_dates?: string[];
  deposits_sum: number;
  payments_sum: number;
  deposits: CashDepositEntity[];
  aggregatedPayments: AggregatedPayment[];
}

export interface CashReconciliationOutput {
  type: ReconciliationType;
  location: string;
  total_deposits: number;
  total_payments: number;
  total_in_progress: number;
  total_exceptions: number;
  total_matches: number;
  percent_matched: number;
}
export interface CashMatches {
  payment: AggregatedPayment;
  deposit: CashDepositEntity;
}
