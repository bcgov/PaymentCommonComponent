import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { DetailsReport } from './details-report';
import { DateRange, NormalizedLocation } from '../../constants';
import { PaymentEntity } from '../../transaction/entities/payment.entity';

export class PaymentDetailsReport extends DetailsReport {
  /*eslint-disable */

  constructor(
    location: NormalizedLocation,
    payment: PaymentEntity,
    dates?: DateRange
  ) {
    super();
    this.source_file = 'Transaction (LOB)';
    this.reconciliation_status = payment.status;
    this.transaction_id = payment.transaction.transaction_id;
    this.reconciled_date = payment.reconciled_on
      ? format(payment.reconciled_on, 'yyyy-MM-dd')
      : null;
    this.in_progress_date = payment.in_progress_on
      ? format(payment.in_progress_on, 'yyyy-MM-dd')
      : payment.reconciled_on
      ? format(payment.reconciled_on, 'yyyy-MM-dd')
      : 'PENDING';
    this.txn_date = payment.transaction.transaction_date;
    this.type = payment.payment_method.classification;
    this.time = payment.transaction.transaction_time ?? '';
    this.close_date = payment.transaction.fiscal_close_date;
    this.payment_method = payment.payment_method.description;
    this.amount = new Decimal(payment.amount).toDecimalPlaces(2).toNumber();
    this.foreign_currency_amount = payment.foreign_currency_amount ?? null;
    this.currency = payment.currency ?? 'CAD';
    this.exchange_rate = payment.exchange_rate
      ? new Decimal(payment.exchange_rate).toDecimalPlaces(2).toNumber()
      : null;
    this.heuristic_match_round = payment.heuristic_match_round ?? null;
    this.employee_id =
      payment.transaction.transactionJson?.misc.employee_id ?? null;
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
