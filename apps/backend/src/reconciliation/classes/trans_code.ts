import { transaction_codes } from '../const/trans_codes';

export class TransactionCode {
  code: number;
  type: string;
  description: string;
  constructor(data: any) {
    transaction_codes.map(
      (itm: TransactionCode) => data === itm.code && Object.assign(this, itm)
    );
  }
}
