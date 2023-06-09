import * as Excel from 'exceljs';
import { Ministries } from '../constants';

export interface ReportConfig {
  program: Ministries;
  locations: number[];
  period: {
    from: string;
    to: string;
  };
  exceptions: {
    generate: boolean;
    send: boolean;
  };
  reports: boolean;
}

export interface DailySummary {
  values: {
    program: string;
    date: string;
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
