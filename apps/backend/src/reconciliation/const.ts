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
  event_type: EventTypeEnum;
  total_deposit: number;
  total_payments: number;
  total_matched: number;
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
