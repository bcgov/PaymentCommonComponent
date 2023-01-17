import { Metadata } from '../types/metadata';

export class CashDeposit {
  program_code: string;

  deposit_date: string;

  transaction_type: number;

  location_id: number;

  deposit_time: string;

  seq_no: string;

  location_desc: string;

  deposit_amt_curr: number;

  currency: string;

  exchange_adj_amt: number;

  deposit_amt_cdn: number;

  destination_bank_no: string;

  transaction_date: string;

  metadata: Metadata;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
