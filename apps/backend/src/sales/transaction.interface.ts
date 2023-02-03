
export enum PaymentChannel {
  INPERSON = 'in-person',
  PHONE = 'phone',
  MAIL = 'mail',
  ONLINE = 'online'
}
export interface PaymentMethod {
  description: string;
  method: string;
}

export interface Payment {
  amount: number;
  currency: string;
  exchange_rate: number;
  payment_method: string;
  payment_channel: PaymentChannel;
  terminal: {
    card_no: string;
    merchant_id: string;
    device_id: string;
    invoice_no: string;
  }
  online: {
    tran_id: string;
    order_no: string;
  }
  pos: { 
    approval_code: string;
  }
}
export interface AccountingItem {
  sequence: string;
  details: {
    code: string;
    description: string;
  },
  distributions: Distribution[];
}

export interface GL { 
  client_code: string;
  resp_code: string;
  service_line_code: string;
  stob_code: string;
  project_code: string;
  location_code: string;
  future_code: string;
  supplier_code: string;
}

export interface Distribution {
  line_number: string;
  line_description: string;
  line_dollar_amount: string;
  disbursment_gl_account: GL;
  revenue_gl_account: GL;
}

export interface Transaction {
  transaction_id: string;
  transaction_date: string;
  transaction_time: string;
  fiscal_close_date: string;
  payment_total: number;
  void_indicator: boolean;
  misc: unknown;
  source: {
    source_id: string;
    location_id: number;
    accepted_payment_methods: string[];
  };
  payments: Payment[];
  accounting: AccountingItem[]
}
