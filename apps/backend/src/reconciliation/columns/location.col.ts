import { Column } from 'typeorm';
import { sbc_locations } from '../constants/locations';

export class Location {
  @Column({ nullable: true })
  office: string;

  @Column({ nullable: true })
  merchant_id: number;

  @Column({ nullable: true })
  location_id: number;

  constructor(data: any, program: string) {
    if (program === 'SBC') {
      sbc_locations.filter((itm: Location) => {
        if (data === itm) {
          Object.assign(this, itm);
        }
      });
    }
  }
}
