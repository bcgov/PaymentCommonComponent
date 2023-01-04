import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cash_deposit(TDI17)')
export class CashDepositEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column()
  program_cd: string;

  @Column()
  deposit_date: string;

  @Column({ nullable: true })
  transaction_type: number;

  @Column()
  location_id: number;

  @Column({ nullable: true })
  deposit_time: string;

  @Column({ nullable: true })
  seq_no: string;

  @Column()
  location_desc: string;

  @Column()
  deposit_amt_curr: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  exchange_adj_amt: string;

  @Column()
  deposit_amt_cdn: string;

  @Column()
  destination_bank_no: string;

  @Column({ nullable: true })
  batch_no: string;

  @Column({ nullable: true })
  jv_type: string;

  @Column({ nullable: true })
  jv_no: string;
}
