import {
  Entity,
  ManyToOne,
  Relation,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { LocationEntity } from './location.entity';

@Entity('location_merchant')
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
