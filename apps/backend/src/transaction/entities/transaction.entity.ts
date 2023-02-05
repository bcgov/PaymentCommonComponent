import { OneToMany, Entity, Column, PrimaryColumn } from 'typeorm';
import { ColumnNumericTransformer } from '../../common/transformers/numericColumnTransformer';
import { Transaction } from '../transaction.interface';
import { PaymentEntity } from './payment.entity';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ nullable: true })
  transaction_time: string;

  @Column({ type: 'date' })
  fiscal_close_date: string;

  @Column({ type: 'numeric', precision: 16, scale: 4, transformer: new ColumnNumericTransformer(), })
  amount: number;

  @Column({ type: 'boolean', default: false })
  void_indicator: boolean;

  @Column('varchar', { length: 10 })
  source_id: string;

  @Column()
  location_id: number;

  @Column({ type: 'jsonb', nullable: false })
  transactionJson: Partial<Transaction>;

  // PCC Internals

  @Column({ type: 'boolean', default: false })
  migrated?: boolean;

  @Column('varchar', { length: 50, nullable: true })
  source_file_name?: string;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: PaymentEntity[];

  constructor(transaction: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
