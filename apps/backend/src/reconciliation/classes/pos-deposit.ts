import { Metadata } from '../types/metadata';

export class POSDeposit {
  line_number: number;

  merchant_id: number;

  terminal_no: string;

  card_vendor: string;

  card_id: string;

  transaction_date: string;

  transaction_time: string;

  settlement_date: string;

  transaction_cd: string;

  approval_code: string;

  transaction_amt: number;

  metadata: Metadata;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
