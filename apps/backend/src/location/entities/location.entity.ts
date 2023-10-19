import {
  Entity,
  Unique,
  Column,
  OneToMany,
  Relation,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { BankLocationEntity } from './location_bank.entity';
import { MerchantLocationEntity } from './location_merchant.entity';

@Entity('location')
@Unique(['location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], { unique: true })
export class LocationEntity {
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

  @OneToMany(() => BankLocationEntity, (bank) => bank.location, {
    cascade: true,
  })
  banks: Relation<BankLocationEntity[]>;

  @OneToMany(() => MerchantLocationEntity, (merchant) => merchant.location, {
    cascade: true,
  })
  merchants: Relation<MerchantLocationEntity[]>;

  constructor(data?: Partial<LocationEntity>) {
    Object.assign(this, data);
  }
}
