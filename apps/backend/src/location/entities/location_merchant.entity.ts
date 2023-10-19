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
@Unique(['id', 'location'])
@Index('location_merchant_idx', ['id', 'location'], { unique: true })
export class MerchantLocationEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @ManyToOne(() => LocationEntity, (location) => location.merchants)
  @JoinColumn({ name: 'location', referencedColumnName: 'location_id' })
  @JoinColumn({ name: 'source_id', referencedColumnName: 'source_id' })
  location: Relation<LocationEntity>;

  constructor(data?: Partial<MerchantLocationEntity>) {
    Object.assign(this, data);
  }
}
