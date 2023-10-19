import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { LocationEntity } from './location.entity';

@Entity('master_location_data')
export class MasterLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 15, nullable: false })
  source_id: string;

  @Column({ type: 'int4', nullable: false })
  location_id: number;

  @Column('varchar', { length: 15, nullable: true })
  method: string;

  @Column({ type: 'int4', nullable: true })
  pt_location_id: number;

  @Column('varchar', { length: 255, nullable: false })
  description: string;

  @Column('varchar', { length: 10, nullable: false })
  program_code: number;

  @Column('varchar', { length: 255, nullable: false })
  program_desc: string;

  @Column('varchar', { length: 3, nullable: false })
  ministry_client: number;

  @Column('varchar', { length: 5, nullable: false })
  resp_code: string;

  @Column('varchar', { length: 5, nullable: false })
  service_line_code: number;

  @Column('varchar', { length: 4, nullable: false })
  stob_code: number;

  @Column('varchar', { length: 7, nullable: false })
  project_code: number;

  @Column({ type: 'int4', nullable: true })
  merchant_id: number;

  constructor(data: Partial<LocationEntity>) {
    Object.assign(this, data);
  }
}
