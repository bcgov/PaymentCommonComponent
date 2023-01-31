import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { CashDepositEntity } from './../../cash/entities/cash-deposit.entity';
import { TransactionEntity } from './transaction.entity';

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
  amount: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;

  @Column({ default: false })
  match?: boolean;

  @ManyToOne(
    () => CashDepositEntity,
    (cashDeposit: CashDepositEntity) => cashDeposit.id,
    { nullable: true }
  )
  @JoinColumn({ name: 'cash_deposit_id', referencedColumnName: 'id' })
  cash_deposit_id?: string;

  @Column({ nullable: true })
  pos_deposit_id?: string;

  constructor(payment: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
