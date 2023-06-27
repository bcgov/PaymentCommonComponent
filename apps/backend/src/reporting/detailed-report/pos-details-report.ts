import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { DetailsReport } from './details-report';
import {
  NormalizedLocation,
  PaymentMethodClassification,
} from '../../constants';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';

export class POSDepositDetailsReport extends DetailsReport {
  constructor(location: NormalizedLocation, deposit: POSDepositEntity) {
    super(location);
    this.source_file = 'POS (TDI 34)';
    this.reconciled_date = deposit.reconciled_on
      ? format(deposit.reconciled_on, 'yyyy-MM-dd')
      : null;
    this.in_progress_date = deposit.in_progress_on
      ? format(deposit.in_progress_on, 'yyyy-MM-dd')
      : deposit.reconciled_on
      ? format(deposit.reconciled_on, 'yyyy-MM-dd')
      : 'PENDING';
    this.reconciliation_status = deposit.status;
    this.txn_date = deposit.transaction_date;
    this.time = deposit.transaction_time;
    this.close_date = deposit.settlement_date;
    this.type = PaymentMethodClassification.POS;
    this.payment_method = deposit.payment_method.description;
    this.amount = new Decimal(deposit.transaction_amt)
      .toDecimalPlaces(2)
      .toNumber();
    this.currency = 'CAD';
    this.merchant_id = deposit.merchant_id;
    this.terminal_no = deposit.terminal_no;
    this.card_id = deposit.card_id;
    this.transaction_code = deposit.transaction_code;
    this.location_id = location.location_id;
    this.location = location.description;
    this.heuristic_match_round = deposit.heuristic_match_round ?? null;
    this.transaction_id =
      deposit.payment_match?.transaction.transaction_id ?? null;
  }
}
