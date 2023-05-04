import { MatchStatus } from '../../common/const';
import { DateRange, Ministries } from '../../constants';
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
}

export interface ReconciliationError {
  error: string;
}

export interface AggregatedPayment {
  status: MatchStatus;
  fiscal_close_date: string;
  location_id: number;
  amount: number;
  cash_deposit_match: CashDepositEntity;
  payments: PaymentEntity[];
}
