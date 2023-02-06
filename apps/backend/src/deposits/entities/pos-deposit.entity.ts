import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TDI34Details } from '../../flat-files';
import { FileMetadata } from '../../common/columns';
import { parse } from 'date-fns';
import { PaymentMethodEntity } from '../../transaction/entities';
import { ColumnNumericTransformer } from '../../common/transformers/numericColumnTransformer';

@Entity('pos_deposit')
export class POSDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ default: 'TDI34' })
  source_file_type: string;

  @Column()
  merchant_id: number;

  @Column()
  card_vendor: string;

  @Column()
  card_id: string;

  @Column({ type: 'numeric', precision: 16, scale: 4, transformer: new ColumnNumericTransformer(), })
  transaction_amt: number;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ nullable: true, type: 'time' })
  transaction_time: string;

  @Column()
  terminal_no: string;

  @Column({ nullable: true, type: 'date' })
  settlement_date: string;

  @Column({ nullable: true })
  transaction_code: number;

  @Column({ default: false })
  match: boolean;

  // rename this to just payment id?
  @Column({ nullable: true })
  matched_payment_id?: string;

  @ManyToOne(() => PaymentMethodEntity, (pd) => pd.method)
  @JoinColumn({ name: 'card_vendor' })
  payment_method: PaymentMethodEntity;

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
