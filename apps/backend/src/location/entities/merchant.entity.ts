import {
  Entity,
  ManyToOne,
  Relation,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import {  MinistryLocationEntity } from './location.entity';

@Entity('location_merchant')
export class MerchantEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @ManyToOne(() => MinistryLocationEntity, (location) => location.merchants)
  @JoinColumn({ name: 'location', referencedColumnName: 'id' })
  location: Relation<MinistryLocationEntity>;

  constructor(data?: Partial<MerchantEntity>) {
    Object.assign(this, data);
  }
}
