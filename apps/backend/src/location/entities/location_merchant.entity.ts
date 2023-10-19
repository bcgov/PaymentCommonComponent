import {
  Entity,
  ManyToOne,
  Relation,
  JoinColumn,
  Index,
  Unique,
  PrimaryColumn,
} from 'typeorm';
import { LocationEntity } from './location.entity';

@Entity('location_merchant')
@Unique('merchant_id', ['merchant_id', 'location'])
@Index('location_merchant_idx', ['merchant_id', 'location'], { unique: true })
export class MerchantLocationEntity {
  @PrimaryColumn({ unique: true })
  merchant_id: number;

  @ManyToOne(() => LocationEntity, (location) => location.merchants)
  @JoinColumn({ name: 'location', referencedColumnName: 'location_id' })
  @JoinColumn({ name: 'source_id', referencedColumnName: 'source_id' })
  location: Relation<LocationEntity>;

  constructor(data?: Partial<MerchantLocationEntity>) {
    Object.assign(this, data);
  }
}
