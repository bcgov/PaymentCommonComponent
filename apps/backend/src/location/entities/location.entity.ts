import {
  Entity,
  Unique,
  OneToMany,
  Relation,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { BaseLocationEntity } from './location_base';
import { BankLocationEntity, MerchantEntity } from '.';

@Entity('location')
@Unique(['id', 'location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], { unique: true })
export class LocationEntity extends BaseLocationEntity {
  @PrimaryColumn('varchar', { length: 15, nullable: false })
  source_id: string;

  @PrimaryColumn({ type: 'int4', nullable: false })
  location_id: number;

  @OneToMany(() => BankLocationEntity, (bank) => bank.location, {
    cascade: true,
  })
  banks: Relation<BankLocationEntity[]>;

  @OneToMany(() => MerchantEntity, (merchant) => merchant.location, {
    cascade: true,
  })
  merchants: Relation<MerchantEntity[]>;

  constructor(data: Partial<LocationEntity>) {
    super(data);
    Object.assign(this, data);
  }
}
