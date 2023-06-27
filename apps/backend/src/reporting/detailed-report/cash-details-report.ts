import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { DetailsReport } from './details-report';
import {
  NormalizedLocation,
  PaymentMethodClassification,
} from '../../constants';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';

export class CashDepositDetailsReport extends DetailsReport {
  constructor(location: NormalizedLocation, deposit: CashDepositEntity) {
    super();
    this.source_file = 'Cash/Chq (TDI 17)';
    this.reconciliation_status = deposit.status;
    this.reconciled_date = deposit.reconciled_on
      ? format(deposit.reconciled_on, 'yyyy-MM-dd')
      : null;
    this.in_progress_date = deposit.in_progress_on
      ? format(deposit.in_progress_on, 'yyyy-MM-dd')
      : deposit.reconciled_on
      ? format(deposit.reconciled_on, 'yyyy-MM-dd')
      : 'PENDING';
    this.transaction_id = deposit.jv_no ?? '';

    this.close_date = deposit.deposit_date;
    this.type = PaymentMethodClassification.CASH;
    this.time = deposit.deposit_time ?? null;
    this.payment_method = 'CASH/CHQ';
    this.amount = new Decimal(deposit.deposit_amt_cdn)
      .toDecimalPlaces(2)
      .toNumber();
    this.foreign_currency_amount =
      deposit.deposit_amt_curr !== deposit.deposit_amt_cdn
        ? new Decimal(deposit.deposit_amt_curr).toNumber()
        : null;
    this.currency = deposit.currency ?? 'CAD';
    this.exchange_rate =
      new Decimal(deposit.exchange_adj_amt).toNumber() ?? null;
    this.misc = '';
    this.merchant_id = null;
    this.terminal_no = '';
    this.card_id = '';
    this.transaction_code = null;
    this.approval_code = '';
    this.invoice_no = '';
    this.echo_data_field = '';

    this.location = location.description;
    this.location_id = location.location_id;
    this.dist_resp_code = location.resp_code;
    this.dist_service_line_code = location.service_line_code;
    this.dist_stob_code = location.stob_code;
    this.dist_project_code = location.project_code;
    this.dist_location_code = location.location_id;
    this.dist_client_code = null;
  }
}
