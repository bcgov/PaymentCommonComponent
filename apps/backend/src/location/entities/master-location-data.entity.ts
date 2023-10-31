import { Column, Entity } from 'typeorm';
import { BaseLocationEntity } from './location_base';

@Entity('master_location_data')
export class MasterLocationEntity extends BaseLocationEntity {
  @Column('varchar', { length: 15, nullable: false })
  method: string;

  @Column({ type: 'int4', nullable: true })
  pt_location_id: number;

  @Column({ type: 'int4', nullable: false })
  merchant_id: number;
}
