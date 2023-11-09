import { Entity, Unique, OneToMany, Relation, Index } from 'typeorm';
import { BaseLocationEntity } from './location_base';
import { BankLocationEntity, MerchantEntity } from '.';

@Entity('location')
@Unique(['location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], {
  unique: true,
})
export class MinistryLocationEntity extends BaseLocationEntity {
  @OneToMany(() => BankLocationEntity, (bank) => bank.location, {
    cascade: true,
    eager: true,
  })
  banks: Relation<BankLocationEntity[]>;

  @OneToMany(() => MerchantEntity, (merchant) => merchant.location, {
    cascade: true,
    eager: true,
  })
  merchants: Relation<MerchantEntity[]>;

  constructor(data: Partial<MinistryLocationEntity>) {
    super();
    Object.assign(this, data);
  }
}
