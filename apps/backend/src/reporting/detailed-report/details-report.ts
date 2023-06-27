import { MatchStatus } from '../../common/const';
import {
  PaymentMethodClassification,
} from '../../constants';
import { PosHeuristicRound } from '../../reconciliation/types';

/*eslint-disable @typescript-eslint/no-explicit-any*/
export class DetailsReport {
  source_file: string;
  reconciliation_status: MatchStatus;
  transaction_id?: string | null;
  location_id: number;
  location: string;
  txn_date?: string | null;
  time?: string;
  uploaded_date?: string | null;
  close_date?: string | null;
  in_progress_date?: string | null;
  reconciled_date?: string | null;
  heuristic_match_round?: PosHeuristicRound | null;
  type: PaymentMethodClassification;
  payment_method: string;
  amount: number | null;
  foreign_currency_amount: number | null;
  currency: string;
  exchange_rate: number | null;
  misc?: string;
  employee_id?: string | null;
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
