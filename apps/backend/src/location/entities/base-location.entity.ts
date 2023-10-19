import { Column, PrimaryColumn } from 'typeorm';
import { LocationEntity } from './location.entity';

export class BaseLocationEntity {
  @PrimaryColumn('varchar', { length: 15, nullable: false })
  source_id: string;

  @PrimaryColumn({ type: 'int4', nullable: false })
  location_id: number;

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

  constructor(data: Partial<LocationEntity>) {
    Object.assign(this, data);
  }
}
