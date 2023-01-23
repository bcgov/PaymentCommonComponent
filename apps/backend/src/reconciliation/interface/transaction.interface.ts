export interface IPaymentMethod {
  garms_code: number;
  description: string;
  method: string;
}
export interface IPayment {
  method: number;
  amount: number;
  exchange_rate: number;
  currency: string;
}

export interface ILocation {
  sbc_location_id: number;
  pt_location_id: number;
  merchant_id: number;
  office_name: string;
}

export interface ITransaction {
  transaction_id: string;
  transaction_date: string;
  transaction_time: string;
  location_id: number;
  payments: IPayment[];
  payment_total: number;
}
