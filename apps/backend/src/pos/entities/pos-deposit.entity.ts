import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TDI34Details } from '../../flat-files';
import { FileMetadata } from '../../common/columns';

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

  @Column({ type: 'numeric' })
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

  constructor(data?: TDI34Details) {
    Object.assign(this, data?.resource);
  }
}
