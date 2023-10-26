import { Entity, Unique, OneToMany, Relation, Index } from 'typeorm';
import { BankLocationEntity } from './location_bank.entity';
import { SourceEntity } from './location_base';
import { MerchantEntity } from './location_merchant.entity';

@Entity('location')
@Unique(['id', 'location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], { unique: true })
export class LocationEntity extends SourceEntity {
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
