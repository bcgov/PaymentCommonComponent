import { MatchStatus } from '../../common/const';
import {
  NormalizedLocation,
  PaymentMethodClassification,
} from '../../constants';
import { PosHeuristicRound } from '../../reconciliation/types';

/*eslint-disable @typescript-eslint/no-explicit-any*/
export class DetailsReport {
  uuid: string;
  match_id?: string | null;
  source_file: string;
  reconciliation_status: MatchStatus;
  transaction_id?: string | null;
  location_id: number;
  location: string;
  txn_date?: Date | null;
  time?: string;
  uploaded_date?: Date | null;
  close_date?: Date | null;
  in_progress_date?: Date | null;
  reconciled_date?: Date | null;
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

  setInProgressDate(itm: any) {
    if (itm.in_progress_on) {
      return itm.in_progress_on;
    }
    if (!itm.in_progress_on && itm.reconciled_on) {
      return itm.reconciled_on;
    }
    return null;
  }
  constructor(location: NormalizedLocation) {
    this.location = location.description;
    this.location_id = location.location_id;
    this.dist_resp_code = location.resp_code;
    this.dist_service_line_code = location.service_line_code;
    this.dist_stob_code = location.stob_code;
    this.dist_project_code = location.project_code;
    this.dist_location_code = location.location_id;
    this.dist_client_code = null;
    this.misc = '';
    this.merchant_id = null;
    this.terminal_no = '';
    this.card_id = '';
    this.transaction_code = null;
    this.approval_code = '';
    this.invoice_no = '';
    this.echo_data_field = '';
  }
}
