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
    return `${this.transaction_id}-${this.seq}`;
  }

  @Generated()
  seq?: number;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.transaction_id
  )
  @JoinColumn({ name: 'transaction' })
  transaction_id?: TransactionEntity;

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
