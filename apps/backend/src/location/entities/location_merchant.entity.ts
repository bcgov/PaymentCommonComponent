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
export class MerchantEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @ManyToOne(() => LocationEntity, (location) => location.merchants)
  @JoinColumn({ name: 'location', referencedColumnName: 'id' })
  location: Relation<LocationEntity>;

  constructor(data?: Partial<MerchantEntity>) {
    Object.assign(this, data);
  }
}
