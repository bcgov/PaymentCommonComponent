import { TransactionEntity } from './transaction.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne
} from 'typeorm';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.id,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction', referencedColumnName: 'id' })
  transaction: TransactionEntity;

  @Column()
  method: number;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;

  @Column({ nullable: true })
  deposit_id?: string;

  @Column({ default: false })
  match?: boolean;

  constructor(payment: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
