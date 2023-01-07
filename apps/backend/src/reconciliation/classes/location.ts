export class Location {
  location_id: number;
  merchant_no: number;
  office: string;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
