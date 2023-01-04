import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pos_deposit(TDI34)')
export class POSDepositEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

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
  transaction_cd: string;

  @Column()
  transaction_amt: string;
}
