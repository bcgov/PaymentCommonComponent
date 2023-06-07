import { NormalizedLocation } from '../../constants';

export class CasLocationReport {
  location_id: number;
  loction_name: string;
  dist_client_code: number;
  dist_resp_code: string;
  dist_stob_code: number;
  dist_service_line_code: number;
  dist_project_code: number;
  constructor(location: NormalizedLocation) {
    this.location_id = location.location_id;
    this.loction_name = location.description;
    this.dist_client_code = location.ministry_client;
    this.dist_resp_code = location.resp_code;
    this.dist_stob_code = location.stob_code;
    this.dist_service_line_code = location.service_line_code;
    this.dist_project_code = location.project_code;
  }
}
export class CasReport extends CasLocationReport {
  settlement_date: string;
  card_vendor: string;
  amount: number;
  constructor(data: {
    payment_method: unknown;
    settlement_date: string;
    amount: number;
    location: NormalizedLocation;
  }) {
    super(data.location);
    this.card_vendor = data?.payment_method as string;
    Object.assign(this, data);
  }
}
