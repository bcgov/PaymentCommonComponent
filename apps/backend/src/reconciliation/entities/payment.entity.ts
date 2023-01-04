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
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.payments,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction' })
  transaction: TransactionEntity;

  @Column()
  method: string;

  @Column()
  amount?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  exchange_rate?: string;

  constructor(data?: any) {
    Object.assign(this, data);
  }
}
