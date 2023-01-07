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
    (transaction: TransactionEntity) => transaction.payments,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction' })
  transaction: TransactionEntity;

  @Column()
  method: number;

  @Column()
  amount?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  exchange_rate?: string;
}
