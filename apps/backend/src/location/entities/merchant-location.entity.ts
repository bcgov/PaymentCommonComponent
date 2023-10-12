import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { LocationEntity } from './location.entity';
import { Merchant } from '../../constants';
import { PaymentMethodEntity } from '../../transaction/entities';

@Entity('merchant_location')
export class MerchantLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  merchant_id: number;

  @Column()
  source_id: string;

  @ManyToOne(() => PaymentMethodEntity, (pm: PaymentMethodEntity) => pm.method)
  @JoinColumn([{ name: 'payment_method', referencedColumnName: 'method' }])
  payment_method: Relation<PaymentMethodEntity>;

  @ManyToOne(() => LocationEntity, (location: LocationEntity) => location.id, {
    eager: true,
  })
  @JoinColumn({ name: 'location', referencedColumnName: 'id' })
  location: Relation<LocationEntity>;

  constructor(data: Merchant) {
    Object.assign(this, data);
  }
}
