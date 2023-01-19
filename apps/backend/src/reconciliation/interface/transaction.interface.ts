import { IPayment } from './payment.interface';

export interface ITransaction {
  transaction_id: string;
  transaction_date: string;
  transaction_time: string;
  location: number;
  payments: IPayment[];
  payment_total: number;
}
