import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FileMetadata } from '../columns/metadata.col';

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

  @Column()
  transaction_date: Date;

  @Column()
  transaction_time: string;

  @Column()
  terminal_no: string;

  @Column()
  settlement_date: Date;

  @Column({ nullable: true })
  transaction_code: number;

  @Column({ default: false })
  match: boolean;
}
