import { format, parse } from 'date-fns';
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
import { FileTypes } from '../../constants';
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

  @Column({ enum: FileTypes, default: FileTypes.TDI34 })
  source_file_type: FileTypes;

  @Column({ type: 'int4' })
  merchant_id: number;

  @Column('varchar', { length: 2 })
  card_vendor: string;

  @Column('varchar', { length: 19 })
  card_id: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  transaction_amt: number;

  @Column({ type: 'timestamp' })
  transaction_date: Date;

  @Column({ type: 'time', nullable: true })
  transaction_time: string;

  @Column('varchar', { length: 19 })
  terminal_no: string;

  @Column({ nullable: true, type: 'timestamp' })
  settlement_date: Date;

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
      `${format(this.transaction_date, 'yyyy-MM-dd')}${this.transaction_time}`,
      'yyyy-MM-ddHH:mm:ss',
      new Date()
    );
  }
}
