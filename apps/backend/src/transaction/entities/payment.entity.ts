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

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_rate?: number;

  @Column({ nullable: true })
  channel?: string;

  @Column('varchar', { length: 10, nullable: false })
  method: string;

  @Column('varchar', { length: 4, nullable: true })
  card_no?: string;

  @Column('varchar', { length: 25, nullable: true })
  merchant_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  device_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  invoice_no?: string;

  @Column('varchar', { length: 25, nullable: true })
  tran_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  order_no?: string;

  @Column('varchar', { length: 25, nullable: true })
  approval_code?: string;

  // PCC - Internals

  @Column({ type: 'boolean', default: false })
  match?: boolean;

  @Column('varchar', { length: 50, nullable: true })
  deposit_id?: string;

  // TODO: Check if this creates fk constraint
  @OneToOne(() => PaymentMethodEntity, (pm) => pm.method)
  payment_method: PaymentMethodEntity;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.id,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction', referencedColumnName: 'id' })
  transaction: TransactionEntity;

  constructor(payment: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
