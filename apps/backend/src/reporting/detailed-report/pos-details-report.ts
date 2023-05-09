import { DetailsReport } from './details-report';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../../location/entities/master-location-data.entity';

export class POSDepositDetailsReport extends DetailsReport {
  constructor(location: LocationEntity, deposit: POSDepositEntity) {
    super(location);
    this.source_file = 'POS (TDI 34)';
    this.reconciliation_status = deposit.status;
    this.date = deposit.transaction_date;
    this.time = deposit.transaction_time;
    this.fiscal_date = deposit.settlement_date;
    this.payment_method = deposit.payment_method.description;
    this.amount = deposit.transaction_amt;
    this.currency = 'CAD';
    this.merchant_id = deposit.merchant_id;
    this.terminal_no = deposit.terminal_no;
    this.card_id = deposit.card_id;
    this.transaction_code = deposit.transaction_code;
  }
}
