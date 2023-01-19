import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FileMetadata } from '../columns/metadata.col';

@Entity('cash_deposit')
//TODO discuss unique constrinats and apply
export class CashDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ default: 'TDI17' })
  source_file_type: string;

  @Column({ nullable: true })
  program_code?: string;

  @Column()
  deposit_date: Date;

  @Column()
  transaction_type: number;

  @Column()
  location_id: number;

  @Column({ nullable: true })
  deposit_time: string;

  @Column()
  seq_no: string;

  @Column()
  location_desc: string;

  @Column({ type: 'numeric' })
  deposit_amt_curr: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'numeric', nullable: true })
  exchange_adj_amt: number;

  @Column({ type: 'numeric' })
  deposit_amt_cdn: number;

  @Column()
  destination_bank_no: string;

  @Column({ nullable: true })
  batch_no: string;

  @Column({ nullable: true })
  jv_type: string;

  @Column({ nullable: true })
  jv_no: string;

  @Column({ default: false })
  match: boolean;
}
