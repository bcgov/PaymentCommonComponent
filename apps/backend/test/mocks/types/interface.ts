import { LocationEntity } from './../../../src/location/entities/master-location-data.entity';
import {
  DateRange,
  Ministries,
  PaymentMethodClassification
} from '../../../src/constants';
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
export interface BaseData {
  dateRange: DateRange;
  program: Ministries;
  location: LocationEntity;
}
