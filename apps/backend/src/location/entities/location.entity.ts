import {
  Entity,
  Unique,
  OneToMany,
  Relation,
  Index,
} from 'typeorm';
import { BankLocationEntity } from './location_bank.entity';
import { MerchantLocationEntity } from './location_merchant.entity';
import { MasterLocationEntity } from './master-location-data.entity';

@Entity('location')
@Unique(['location_id', 'source_id'])
@Index('location_source_idx', ['location_id', 'source_id'], { unique: true })
export class LocationEntity extends MasterLocationEntity {
  @OneToMany(() => BankLocationEntity, (bank) => bank.location, {
    cascade: true,
  })
  banks: Relation<BankLocationEntity[]>;

  @OneToMany(() => MerchantLocationEntity, (merchant) => merchant.location, {
    cascade: true,
  })
  merchants: Relation<MerchantLocationEntity[]>;

  constructor(data: Partial<LocationEntity>) {
    super(data);
    Object.assign(this, data);
  }
}
