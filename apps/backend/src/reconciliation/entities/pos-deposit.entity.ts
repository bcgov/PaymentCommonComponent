import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pos_deposit')
//TODO
// @Unique([
//   'card_vendor',
//   'merchant_terminal',
//   'terminal_no',
//   'card_id',
//   'transaction_date',
//   'transaction_time',
//   'transaction_amt'
// ])
export class POSDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO
  //@Column()
  //metadata: time/program/lambda/source filename

  // @Column()
  //source_fileheader

  @Column({ default: 'TDI34' })
  source_file_type: string;

  @Column()
  card_vendor: string;

  @Column()
  merchant_terminal: number;

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

  @Column()
  transaction_amt: string;

  @Column({ nullable: true })
  transaction_code: number;
}
