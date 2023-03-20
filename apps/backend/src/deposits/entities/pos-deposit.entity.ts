import { parse } from 'date-fns';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation
} from 'typeorm';
import { FileMetadata } from '../../common/columns';
import { MatchStatus } from '../../common/const';
import { ColumnNumericTransformer } from '../../common/transformers/numericColumnTransformer';
import { TDI34Details } from '../../flat-files';
import { PaymentMethodEntity } from '../../transaction/entities';

@Entity('pos_deposit')
export class POSDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ type: 'enum', default: MatchStatus.PENDING, enum: MatchStatus })
  status: MatchStatus;

  @Column({ default: 'TDI34' })
  source_file_type: string;

  @Column({ type: 'int4' })
  merchant_id: number;

  @Column('varchar', { length: 2 })
  card_vendor: string;

  @Column('varchar', { length: 19 })
  card_id: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 4,
    transformer: new ColumnNumericTransformer()
  })
  transaction_amt: number;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ type: 'time', nullable: true })
  transaction_time: string;

  @Column('varchar', { length: 19 })
  terminal_no: string;

  @Column({ nullable: true, type: 'date' })
  settlement_date: string;

  @Column({ nullable: true })
  transaction_code: number;

  @ManyToOne(() => PaymentMethodEntity, (pd) => pd.method)
  @JoinColumn({ name: 'card_vendor' })
  payment_method: Relation<PaymentMethodEntity>;

  constructor(data?: TDI34Details) {
    Object.assign(this, data?.resource);
  }

  public get timestamp(): Date {
    return parse(
      `${this.transaction_date}${this.transaction_time}`,
      'yyyy-MM-ddHH:mm:ss',
      new Date()
    );
  }
}
