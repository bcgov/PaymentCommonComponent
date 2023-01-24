import { OneToMany, Entity, Column, PrimaryColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';

{
  /*
    This entity represents a partial transaction/sales api json to be used in the reconciliation process.
    There are one or more payments associated with a transaction, and each payment should match to a corresponding deposit, either in the CashDeposit or POSDeposit table.    
 */
}
@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn()
  transaction_id: string;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ type: 'date', nullable: true })
  fiscal_close_date: string;

  @Column({ nullable: true })
  transaction_time?: string;

  @Column({ type: 'numeric' })
  payment_total: number;

  @Column({ default: false, nullable: true })
  match?: boolean;

  @Column()
  location_id: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction, {
    cascade: true
  })
  payments?: PaymentEntity[];

  constructor(transaction: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
