import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transaction_id: string;

  @Column()
  location_id: number;

  @Column()
  transaction_date: string;

  @Column({ nullable: true })
  transaction_time?: string;

  @Column()
  payment_total: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: PaymentEntity[];
}
