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
    super(location);
    this.source_file = 'Transaction (LOB)';
    this.reconciliation_status = payment.status;
    this.transaction_id = payment.transaction.transaction_id;
    this.location_id = location.location_id;
    this.location = location.description;
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
  }
}
