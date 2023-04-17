import {
  SBCGarmsDistribution,
  SBCGarmsPayment,
  SBCGarmsJson
} from './sbc_garms';

export enum PaymentChannel {
  INPERSON = 'in-person',
  PHONE = 'phone',
  MAIL = 'mail',
  ONLINE = 'online'
}

export interface PaymentMethod {
  method: string;
  description: string;
  sbc_code: string;
}

export class Payment {
  amount: number;
  currency?: string;
  exchange_rate?: number;
  payment_method: string;
  payment_channel?: PaymentChannel;
  terminal?: {
    card_no: string;
    merchant_id: string;
    device_id: string;
    invoice_no: string;
  };
  online?: {
    tran_id: string;
    order_no: string;
  };
  pos?: {
    approval_code: string;
  };

  constructor(data: SBCGarmsPayment) {
    try {
      this.amount = data.amount;
      this.currency = data.currency;
      this.exchange_rate = data.exchange_rate;
      this.payment_method = data.method;
      this.payment_channel = undefined;
      this.terminal = undefined;
      this.online = undefined;
      this.pos = undefined;
    } catch (e) {
      console.log(e);
    }
  }
}
export interface AccountingItem {
  sequence: string;
  details: {
    code: string;
    description: string;
  };
  distributions: Distribution[];
}

export class GL {
  client_code: string;
  resp_code: string;
  service_line_code: string;
  stob_code: string;
  project_code: string;
  location_code: string;
  future_code: string;
  supplier_code: string;

  constructor(data: GL) {
    Object.assign(this, data);
  }
}

export class Distribution {
  line_number: string;
  line_description: string;
  line_dollar_amount: string;
  disbursment_gl_account: GL;
  revenue_gl_account: GL;
  constructor(data: SBCGarmsDistribution) {
    try {
      this.line_number = data.line_number;
      this.line_description = data.line_description;
      this.line_dollar_amount = data.line_dollar_amount.toString();
      this.disbursment_gl_account = new GL({
        client_code: data.dist_client_code,
        resp_code: data.dist_resp_code,
        service_line_code: data.dist_service_line_code,
        stob_code: data.dist_stob_code,
        project_code: data.dist_project_code,
        location_code: data.dist_location_code,
        future_code: data.dist_future_code,
        supplier_code: data.supplier_code
      });
      this.revenue_gl_account = new GL({
        client_code: data.dist_client_code,
        resp_code: data.dist_resp_code,
        service_line_code: data.dist_service_line_code,
        stob_code: data.dist_stob_code,
        project_code: data.dist_project_code,
        location_code: data.dist_location_code,
        future_code: data.dist_future_code,
        supplier_code: data.supplier_code
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

interface Source {
  location_id: string;
  source_id: string;
  accepted_payment_methods?: string[];
}

interface Misc {
  [key: string]: string;
}

export class Transaction {
  transaction_id: string;
  transaction_date: Date;
  transaction_time: Date;
  fiscal_close_date: Date;
  payment_total: number;
  void_indicator: boolean | undefined;
  misc: Misc;
  source: Source;
  payments: Payment[];
  accounting?: AccountingItem[];

  constructor(data: SBCGarmsJson) {
    try {
      this.transaction_id = data?.sales_transaction_id;
      this.transaction_date = new Date(data?.sales_transaction_date);
      this.fiscal_close_date = new Date(data?.fiscal_close_date);
      this.payment_total = data?.payment_total;
      this.void_indicator = data.void_indicator !== ' ' ? true : false;
      this.misc = {
        ...data.misc
      };
      this.source = {
        location_id: data?.source?.location_id,
        source_id: data?.source?.source_id,
        accepted_payment_methods: data?.source?.accepted_payment_methods ?? []
      };
      this.payments = data.payments.map((itm) => new Payment(itm));
      this.accounting = Object.values(data.distributions)?.[0].map(
        (itm: SBCGarmsDistribution) =>
          ({
            sequence: itm.line_number,
            details: {
              description: itm.line_description,
              code: itm.dist_client_code
            },
            distributions: Object.values(data.distributions)?.[0].map(
              (itm) => new Distribution(itm)
            )
          } as AccountingItem)
      );
    } catch (e) {
      console.log(this.transaction_id);
      console.log(e);
      throw e;
    }
  }
}
