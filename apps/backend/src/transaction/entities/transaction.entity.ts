import { OneToMany, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from '../transaction.interface';
import { PaymentEntity } from './payment.entity';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //This should be unique - at least across the diff programs
  @Column()
  transaction_id: string;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ type: 'date' })
  fiscal_date: string;

  @Column({ nullable: true })
  transaction_time: string;
  
  @Column({ type: 'date' })
  fiscal_close_date: string;

  @Column({ type: 'numeric' })
  payment_total: number;

  @Column({ type: 'boolean', default: false})
  void_indicator: boolean;

  // @Column({ type: 'string'})
  // source_id:string;
  
  @Column()
  location_id: number;

  @Column({type: 'jsonb'})
  transaction: Transaction;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: PaymentEntity[];

  constructor(transaction: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
