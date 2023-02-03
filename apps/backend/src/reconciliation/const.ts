export interface ReconciliationEvent {
  date: string;
  location_id?: number;
  program: string;
}

export interface ReconciliationEventError {
  error: string;
}

export interface ReconciliationEventOutput {
  total_deposit: number;
  total_payments: number;
  total_matched: number;
}
