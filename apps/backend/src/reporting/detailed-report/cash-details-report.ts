import { DetailsReport } from './details-report';
import { DateRange, NormalizedLocation } from '../../constants';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';

export class CashDepositDetailsReport extends DetailsReport {
  constructor(
    location: NormalizedLocation,
    deposit: CashDepositEntity,
    dates?: DateRange
  ) {
    super(location, dates);
    this.source_file = 'Cash/Chq (TDI 17)';
    this.reconciliation_status = deposit.status;
    this.transaction_id = deposit.jv_no ?? '';
    this.date = deposit.deposit_date;
    this.time = deposit.deposit_time ?? null;
    this.fiscal_date = deposit.deposit_date;
    this.payment_method = 'CASH/CHQ';
    this.amount = deposit.deposit_amt_cdn;
    this.foreign_currency_amount =
      deposit.deposit_amt_curr !== deposit.deposit_amt_cdn
        ? deposit.deposit_amt_curr
        : null;
    this.currency = deposit.currency ?? 'CAD';
    this.exchange_rate = deposit.exchange_adj_amt ?? null;
  }
}
