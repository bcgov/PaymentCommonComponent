import { PaymentMethodClassification } from './../../../../src/constants';
export interface PaymentMethod {
  method: string;
  description: string;
  sbc_code: number;
  classification: PaymentMethodClassification;
}

export interface Location {
  id: string;
  location_id: number;
  description: string;
  pt_location_ids: number[];
  merchant_ids: number[];
}
