import * as Excel from 'exceljs';
import { Ministries } from '../constants';

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
