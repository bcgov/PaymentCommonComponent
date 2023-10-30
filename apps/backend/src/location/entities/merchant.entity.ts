import {
  Entity,
  ManyToOne,
  Relation,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { MinistryLocationEntity } from './location.entity';

@Entity('location_merchant')
export class MerchantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  merchant_id: number;

  @ManyToOne(() => MinistryLocationEntity, (location) => location.merchants)
  @JoinColumn({ name: 'location', referencedColumnName: 'id' })
  location: Relation<MinistryLocationEntity>;

  constructor(data?: Partial<MerchantEntity>) {
    Object.assign(this, data);
  }
}
