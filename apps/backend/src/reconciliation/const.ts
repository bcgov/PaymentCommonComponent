export enum ReconciliationTypes {
  CASH = 'CASH',
  POS = 'POS',
  ALL = 'ALL'
}

export interface ReconciliationEvent {
  fiscal_start_date: string;
  fiscal_close_date: string;
  date?: string;
  location_ids?: number[];
  location_id?: number;
  program: string;
  type: ReconciliationTypes;
}

export interface ReconciliationEventError {
  error: string;
}

export interface ReconciliationEventOutput {
  event_type: ReconciliationTypes;
  total_deposit: number;
  total_payments: number;
  total_matched: number;
}
