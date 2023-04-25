import { DetailsReport } from './details-report';
import { DateRange } from './../../constants';
import { PaymentEntity } from './../../transaction/entities/payment.entity';
import { LocationEntity } from '../../location/entities/master-location-data.entity';

export class PaymentDetailsReport extends DetailsReport {
  /*eslint-disable */

  constructor(
    location: LocationEntity,
    payment: PaymentEntity,
    dates?: DateRange
  ) {
    super(location, dates);
    this.source_file = 'Transaction (LOB)';
    this.reconciliation_status = payment.status;
    this.transaction_id = payment.transaction.transaction_id;
    this.location_id = location.location_id;
    this.location = location.description;
    this.date = payment.transaction.transaction_date;
    this.time = payment.transaction.transaction_time ?? '';
    this.fiscal_date = payment.transaction.fiscal_close_date;
    this.payment_method = payment.payment_method.description;
    this.amount = payment.amount;
    this.foreign_currency_amount = payment.foreign_currency_amount ?? null;
    this.currency = payment.currency ?? 'CAD';
    this.exchange_rate = payment?.exchange_rate ?? null;
  }
}