import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';

export enum EventTypeEnum {
  CASH = 'CASH',
  POS = 'POS'
}

export interface ReconciliationEvent {
  date: string;
  location_id: number;
  program: string;
  type: EventTypeEnum;
}

export interface ReconciliationEventError {
  error: string;
}

export interface ReconciliationEventOutput {
  total_deposit: number;
  total_payments: number;
  total_deposit_amt: number;
  total_payments_amt: number;
  total_matched: number;
  matched: unknown[];
}

export interface IReconciliationService {
  reconcile(
    match: (
      deposit: CashDepositEntity[] | POSDepositEntity[],
      payment: PaymentEntity
    ) => unknown,
    event: ReconciliationEvent
  ): Promise<ReconciliationEventOutput | ReconciliationEventError>;
}
