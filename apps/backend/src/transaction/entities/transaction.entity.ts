import {
  Relation,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';
import { FileUploadedEntity } from '../../parse/entities/file-uploaded.entity';
import { PaymentEntity } from './payment.entity';
import { Transaction } from '../interface/transaction.interface';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn({ unique: true })
  transaction_id: string;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ type: 'time', nullable: true })
  transaction_time: string;

  @Column({ type: 'date' })
  fiscal_close_date: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
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
    cascade: true,
  })
  payments: Relation<PaymentEntity[]>;

  @ManyToOne(() => FileUploadedEntity, { nullable: true })
  @JoinColumn({ name: 'file_uploaded' })
  fileUploadedEntity?: FileUploadedEntity;

  constructor(transaction?: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
