import { format } from 'date-fns';
import { MatchStatus } from '../../common/const';
import { DateRange } from '../../constants';
import { LocationEntity } from '../../location/entities';

/*eslint-disable @typescript-eslint/no-explicit-any*/
export class DetailsReport {
  source_file: string;
  reconciliation_status: MatchStatus;
  transaction_id?: string;
  location_id: number;
  location: string;
  date: string;
  time?: string;
  deposit_date_range?: string;
  fiscal_date?: string;
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
  constructor(location: LocationEntity, dateRange?: DateRange) {
    this.foreign_currency_amount = null;
    this.currency = 'CAD';
    this.transaction_id = '';
    this.deposit_date_range = dateRange
      ? `${format(new Date(dateRange.minDate), 'yyyy-MM-dd')}-${format(
          new Date(dateRange.maxDate),
          'yyyy-MM-dd'
        )}`
      : '';
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
