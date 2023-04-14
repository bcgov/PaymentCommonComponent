import * as Excel from 'exceljs';
import { Ministries } from '../constants';
import { MatchStatus } from './../common/const';

export interface ReportConfig {
  program: Ministries;
  locations: number[];
  period: {
    from: Date;
    to: Date;
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
    date: Date;
    location_id: number;
    location_name: string;
    total_payments: number;
    total_unmatched_payments: number;
    percent_unmatched: number;
    total_sum: number;
  };
  style: Partial<Excel.Style>;
}
/*eslint-disable @typescript-eslint/no-explicit-any*/
export interface DetailsReport {
  source_file: string;
  reconciliation_status: MatchStatus;
  transaction_id?: string;
  location_id: number;
  location: string;
  date: Date;
  time?: string;
  deposit_date_range?: string;
  fiscal_date?: Date;
  payment_method: string;
  amount: number | null;
  foreign_currency_amount: number | null;
  currency: string;
  exchange_rate: number | null;
  misc?: string;
  merchant_id: number | null;
  terminal_no?: string;
  card_id?: string;
  transaction_code: number | null;
  approval_code?: string;
  invoice_no?: string;
  echo_data_field?: string;
  dist_client_code: number | null;
  dist_resp_code?: string;
  dist_service_line_code: number | null;
  dist_stob_code: number | null;
  dist_project_code: number | null;
  dist_location_code: number | null;
  dist_future_code: number | null;
}

export interface Placement {
  row: number;
  column: string;
  height: number;
  merge: string;
}

export interface CasLocationReport {
  location_id: number;
  loction_name: string;
  dist_client_code: number;
  dist_resp_code: string;
  dist_stob_code: number;
  dist_service_line_code: number;
  dist_project_code: number;
}
export interface CasReport extends CasLocationReport {
  settlement_date: Date;
  card_vendor: string;
  amount: number;
}
