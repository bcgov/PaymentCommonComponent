import { Relation, OneToMany, Entity, Column, PrimaryColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { Transaction } from '../interface/transaction.interface';
import { ColumnNumericTransformer } from '../../common/transformers/numericColumnTransformer';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn({ unique: true })
  transaction_id: string;

  @Column({ type: 'timestamp' })
  transaction_date: Date;

  @Column({ type: 'time', nullable: true })
  transaction_time: string;

  @Column({ type: 'timestamp' })
  fiscal_close_date: Date;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  total_transaction_amount: number;

  @Column({ type: 'boolean', default: false })
  void_indicator: boolean;

  @Column('varchar', { length: 10 })
  source_id: string;

  @Column({ type: 'int4' })
  location_id: number;

  @Column({ type: 'jsonb', nullable: false })
  transactionJson?: Transaction;

  // PCC Internals
  @Column({ type: 'boolean', default: false })
  migrated?: boolean;

  @Column('varchar', { length: 50, nullable: true })
  source_file_name?: string;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: Relation<PaymentEntity[]>;

  constructor(transaction?: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
