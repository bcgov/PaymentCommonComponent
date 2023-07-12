import { parse } from 'date-fns';
import Decimal from 'decimal.js';
import { DetailsReport } from './details-report';
import {
  NormalizedLocation,
  PaymentMethodClassification,
} from '../../constants';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';

export class CashDepositDetailsReport extends DetailsReport {
  constructor(location: NormalizedLocation, deposit: CashDepositEntity) {
    super(location);
    this.source_file = 'Cash/Chq (TDI 17)';
    this.reconciliation_status = deposit.status;
    this.reconciled_date = deposit.reconciled_on ?? deposit.reconciled_on;

    this.in_progress_date = this.setInProgressDate(deposit);
    this.transaction_id = deposit.jv_no ?? '';
    this.uploaded_date = deposit.metadata.created_at;
    this.close_date = parse(deposit.deposit_date, 'yyyy-MM-dd', new Date());
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
    this.uuid = deposit.id;
  }
}
