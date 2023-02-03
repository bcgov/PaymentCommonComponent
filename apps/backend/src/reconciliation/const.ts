export interface ReconciliationEvent {
  date: string;
  location_id?: number;
  program: string;
}

export interface ReconciliationEventInput {
  fiscal_start_date: string;
  fiscal_end_date: string;
  location_ids: number[];
  program: string;
}

export interface ReconciliationEventError {
  error: string;
}

export interface ReconciliationEventOutput {
  total_deposit: number;
  total_payments: number;
  total_matched?: number;
  matched?: any[];
}
