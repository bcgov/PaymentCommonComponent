import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FileMetadata } from '../columns/metadata.col';

@Entity('pos_deposit')
export class POSDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata)
  metadata: FileMetadata;

  @Column({ default: 'TDI34' })
  source_file_type: string;

  @Column()
  card_vendor: string;

  @Column()
  merchant_id: number;

  @Column()
  terminal_no: string;

  @Column()
  card_id: string;

  @Column()
  transaction_date: string;

  @Column()
  transaction_time: string;

  @Column()
  settlement_date: string;

  @Column({ type: 'numeric' })
  transaction_amt: number;

  @Column({ nullable: true })
  transaction_code: number;
}
