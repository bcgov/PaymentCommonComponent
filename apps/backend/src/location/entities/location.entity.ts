import { Entity, Unique, OneToMany, Relation, Index } from 'typeorm';
import { BaseLocationEntity } from './location_base';
import { BankLocationEntity, MerchantEntity } from '.';

@Entity('location')
@Unique(['location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], { unique: true })
export class LocationEntity extends BaseLocationEntity {
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
