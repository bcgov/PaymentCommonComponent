import Decimal from 'decimal.js';
import { MatchStatus } from '../../common/const';
import {
  DateRange,
  Ministries,
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

export interface ReconciliationConfigInput {
  period: {
    from: string;
    to: string;
  };
  location_ids: number[] | [];
  program: Ministries;
  bypass_parse_validity?: boolean;
}

export interface ReconciliationError {
  error: string;
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
  [key: string]: PosDepositsDateDictionary;
}

export interface PosDepositsDateDictionary {
  [key: string]: POSDepositEntity[];
}
