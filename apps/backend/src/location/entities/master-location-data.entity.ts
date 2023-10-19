import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LocationEntity } from './location.entity';
import { BaseLocationEntity } from './location_base';

@Entity('master_location_data')
export class MasterLocationEntity extends BaseLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 15, nullable: true })
  method: string;

  @Column({ type: 'int4', nullable: true })
  merchant_id: number;

  @Column({ type: 'int4', nullable: true })
  pt_location_id: number;

  constructor(data: Partial<LocationEntity>) {
    super(data);
    Object.assign(this, data);
  }
}
