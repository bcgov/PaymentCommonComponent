import { PaymentMethodEntity } from './payment-method.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToOne
} from 'typeorm';
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

  @OneToOne(() => PaymentMethodEntity, (pm) => pm.sbc_code)
  payment_method: PaymentMethodEntity;

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

  @Column({ nullable: true })
  deposit_id?: string;

  constructor(payment: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
