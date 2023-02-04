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
import { format, parse, parseISO } from 'date-fns';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
  // https://typeorm.io/entities#column-options - For better numeric representation.
  // 16+4 should be standard for amounts in PCC
  @Column({ type: 'numeric', precision: 16, scale: 4 })
  amount: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'numeric', precision: 16, scale: 4, nullable: true })
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
  @JoinColumn({ name: 'method' })
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

  public get timestamp(): Date {
    return parse(
      `${this.transaction.transaction_date}${this.transaction.transaction_time}`,
      'yyyy-MM-ddHH:mm:ss',
      new Date()
    );
  }
}
