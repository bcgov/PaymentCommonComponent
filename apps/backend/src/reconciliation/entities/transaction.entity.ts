import { OneToMany, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ type: 'numeric' })
  payment_total: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true,
    eager: true
  })
  payments: PaymentEntity[];
}
