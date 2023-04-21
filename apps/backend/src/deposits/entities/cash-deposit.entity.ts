import {
  Relation,
  OneToMany,
  Column,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { FileTypes } from './../../constants';
import { FileMetadata } from '../../common/columns/metadata';
import { MatchStatus } from '../../common/const';
import { ColumnNumericTransformer } from '../../common/transformers/numericColumnTransformer';
import { TDI17Details } from '../../flat-files';
import { PaymentEntity } from '../../transaction/entities/payment.entity';

@Entity('cash_deposit')
export class CashDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ enum: FileTypes, default: FileTypes.TDI17 })
  source_file_type: FileTypes;

  @Column({ nullable: true })
  program_code?: string;

  @Column({ type: 'date' })
  deposit_date: string;

  @Column({ type: 'int4' })
  pt_location_id: number;

  @Column({ type: 'time', nullable: true })
  deposit_time: string;

  @Column('varchar', { length: 3 })
  seq_no: string;

  @Column('varchar', { length: 40 })
  location_desc: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  deposit_amt_curr: number;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  exchange_adj_amt: number;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  deposit_amt_cdn: number;

  @Column('varchar', { length: 4 })
  destination_bank_no: string;

  @Column({ nullable: true })
  batch_no: string;

  @Column({ nullable: true })
  jv_type: string;

  @Column({ nullable: true })
  jv_no: string;

  @Column({ type: 'enum', default: MatchStatus.PENDING, enum: MatchStatus })
  status: MatchStatus;

  @OneToMany(() => PaymentEntity, (payment) => payment.cash_deposit_match, {
    nullable: true
  })
  payment_match?: Relation<PaymentEntity[]>;

  constructor(data?: TDI17Details) {
    Object.assign(this, data?.resource);
  }
}
