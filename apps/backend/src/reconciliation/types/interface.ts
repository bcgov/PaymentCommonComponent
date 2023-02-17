import { MatchStatus } from '../../common/const';
import { Ministries } from '../../constants';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../../transaction/entities';

export interface PosPaymentPosDepositPair {
  payment: PaymentEntity;
  deposit: POSDepositEntity;
}

export interface AggregatedPayment {
  status: MatchStatus;
  fiscal_close_date: string;
  location_id: number;
  amount: number;
  deposit_id: CashDepositEntity;
  payments: PaymentEntity[];
}
export interface CashPaymentsCashDepositPair {
  payment: AggregatedPayment;
  deposit: CashDepositEntity;
}

export interface PosExceptions {
  paymentExceptions: PaymentEntity[] | [];
  depositExceptions: POSDepositEntity[] | [];
}

export interface CashDepositDates {
  current?: string;
  pastDue?: string;
  first?: string;
}

export interface ReconciliationEvent {
  date?: string;
  location_id: number;
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
