import { PaymentMethodEntity } from './payment-method.entity';
import { TransactionEntity } from './transaction.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Generated
} from 'typeorm';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id() {
    return `${this.transaction_id}-${this.seq}`;
  }

  @Generated()
  seq?: number;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.transaction_id
  )
  @JoinColumn({ name: 'transaction' })
  transaction_id: TransactionEntity;

  @ManyToOne(() => PaymentMethodEntity, (m) => m.garms_code, {
    cascade: false,
    eager: true
  })
  @JoinColumn({ name: 'method', referencedColumnName: 'garms_code' })
  method: number;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;

  @Column({ default: false })
  match: boolean;
}
