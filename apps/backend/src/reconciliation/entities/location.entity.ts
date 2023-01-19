import { PrimaryColumn, Entity, Column } from 'typeorm';

@Entity('location')
export class LocationEntity {
  @PrimaryColumn()
  location_id: number;

  @Column()
  merchant_id: number;

  @Column()
  office_name: string;

  @Column()
  ax_merchant_id: number;

  @Column()
  pt_location_id: number;
}
