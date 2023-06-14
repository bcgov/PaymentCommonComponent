import { MatchStatus } from '../../common/const';
import { NormalizedLocation } from '../../constants';
import { PosHeuristicRound } from '../../reconciliation/types';

/*eslint-disable @typescript-eslint/no-explicit-any*/
export class DetailsReport {
  source_file: string;
  reconciliation_status: MatchStatus;
  transaction_id?: string | null;
  location_id: number;
  location: string;
  transaction_date?: string | null;
  deposit_date?: string | null;
  time?: string;
  fiscal_date?: string;
  payment_method: string;
  amount: number | null;
  heuristic_match_round?: PosHeuristicRound | null;
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
  constructor(location: NormalizedLocation) {
    this.foreign_currency_amount = null;
    this.currency = 'CAD';
    this.transaction_id = '';
    this.misc = '';
    this.merchant_id = null;
    this.terminal_no = '';
    this.card_id = '';
    this.transaction_code = null;
    this.approval_code = '';
    this.invoice_no = '';
    this.echo_data_field = '';
    this.dist_client_code = null;
    this.location = location.description;
    this.location_id = location.location_id;
    this.dist_resp_code = location.resp_code;
    this.dist_service_line_code = location.service_line_code;
    this.dist_stob_code = location.stob_code;
    this.dist_project_code = location.project_code;
    this.dist_location_code = location.location_id;
    this.dist_future_code = null;
  }
}
