import * as Excel from 'exceljs';
import { ReconciliationConfigInput } from '../reconciliation/types';

export type ReportConfig = ReconciliationConfigInput;

export interface DailySummary {
  values: {
    program: string;
    dates: string;
    location_id: number;
    location_name: string;
    total_payments: number;
    total_unmatched_payments: number;
    percent_unmatched_payments: number;
    total_payment_sum: number;
    total_deposits: number;
    total_unmatched_deposits: number;
    percent_unmatched_deposits: number;
    total_deposit_sum: number;
  };
  style: Partial<Excel.Style>;
}

export interface Placement {
  row: number;
  column: string;
  height: number;
  merge: string;
}
