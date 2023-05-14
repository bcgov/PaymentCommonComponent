import { parse } from 'date-fns';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
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

  @Column('varchar', { length: 19 })
  card_id: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
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

  @ManyToOne(() => PaymentMethodEntity, (pd) => pd.method, {
    eager: true,
    cascade: false,
  })
  @JoinColumn({ name: 'payment_method', referencedColumnName: 'method' })
  payment_method: Relation<PaymentMethodEntity>;

  @Column({ nullable: true })
  heuristic_match_round?: number;

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
