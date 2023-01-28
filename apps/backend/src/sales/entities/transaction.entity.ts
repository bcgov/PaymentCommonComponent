import { OneToMany, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ nullable: true })
  transaction_time?: string;

  @Column({ type: 'numeric' })
  payment_total: number;

  @Column()
  location_id: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: PaymentEntity[];

  constructor(transaction: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
