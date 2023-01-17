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
  id?: string;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.id
  )
  @JoinColumn({ name: 'transaction' })
  transaction?: TransactionEntity;

  @Column()
  method: string;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;
}
