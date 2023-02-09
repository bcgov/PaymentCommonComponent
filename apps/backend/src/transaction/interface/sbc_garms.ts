export interface SBCGarmsRevenueAccount {
  dist_client_code: string;
  dist_resp_code: string;
  dist_service_line_code: string;
  dist_stob_code: string;
  dist_project_code: string;
  dist_location_code: string;
  dist_future_code: string;
  supplier_code: string;
}
export interface SBCGarmsRevenueAccounts {
  [key: string]: SBCGarmsRevenueAccount;
}
export interface SBCGarmsDistribution {
  line_number: string;
  dist_client_code: string;
  dist_resp_code: string;
  dist_service_line_code: string;
  dist_stob_code: string;
  dist_project_code: string;
  dist_location_code: string;
  dist_future_code: string;
  line_dollar_amount: number;
  line_description: string;
  supplier_code: string;
  revenue_gl_account: string;
}

export interface SBCGarmsDistributions {
  [key: string]: SBCGarmsDistribution[];
}

export interface SBCGarmsPayment {
  method: string;
  amount: number;
  exchange_rate?: number | undefined;
  currency?: string | undefined;
}

export interface SBCGarmsSource {
  location_id: string;
  source_id: string;
  accepted_payment_methods?: string[];
}
interface Misc {
  employee_id: string;
}
export interface IGarmsJson {
  sales_transaction_id: string;
  sales_transaction_date: string;
  fiscal_close_date: string;
  payment_total: number;
  void_indicator?: string;
  transaction_reference?: string;
  misc: Misc;
  payments: SBCGarmsPayment[];
  source: SBCGarmsSource;
  distributions: SBCGarmsDistributions;
  revAccounts: SBCGarmsRevenueAccounts;
}

export interface SBCGarmsMethod {
  garms_code: number;
  description: string;
  method: string;
}
