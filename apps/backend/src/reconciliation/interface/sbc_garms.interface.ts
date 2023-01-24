export interface IGarmsPayment {
  method: string;
  amount: number;
  exchange_rate: number;
  currency: string;
}

interface ISource {
  location_id: string;
}

export interface IGarmsJson {
  sales_transaction_id: string;
  sales_transaction_date: string;
  fiscal_close_date: string;
  payment_total: number;
  payments: IGarmsPayment[];
  source: ISource;
}

export interface IGarmsMethod {
  garms_code: number;
  description: string;
  method: string;
}
