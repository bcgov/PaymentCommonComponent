import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity('transaction(sales)')
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  office_id: number;

  @Column({ nullable: true, type: 'varchar' })
  transaction_id: string;

  @Column({ nullable: true })
  transaction_date?: string;

  @Column({ nullable: true })
  transaction_time?: string;

  @Column()
  payment_total: string;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments: PaymentEntity[];
}
