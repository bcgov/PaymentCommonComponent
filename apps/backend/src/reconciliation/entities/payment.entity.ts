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
  id?() {
    return `${this.transaction}-${this.seq}`;
  }

  @Generated()
  seq?: number;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.transaction_id,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction', referencedColumnName: 'transaction_id' })
  transaction?: TransactionEntity;

  @Column()
  method: number;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;

  @Column({ default: false })
  match?: boolean;

  constructor(payment: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
