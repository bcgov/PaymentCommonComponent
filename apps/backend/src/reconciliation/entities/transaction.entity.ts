import { LocationEntity } from './location.entity';
import {
  OneToMany,
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn()
  transaction_id: string;

  @Column()
  transaction_date: Date;

  @Column({ nullable: true })
  transaction_time?: string;

  @Column({ type: 'numeric' })
  payment_total: number;

  @Column({ default: false })
  match: boolean;

  @ManyToOne(() => LocationEntity, (l) => l.location_id, {
    eager: true,
    cascade: false
  })
  @JoinColumn({ name: 'location', referencedColumnName: 'location_id' })
  location: LocationEntity;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction_id, {
    cascade: true,
    eager: true
  })
  payments: PaymentEntity[];
}
