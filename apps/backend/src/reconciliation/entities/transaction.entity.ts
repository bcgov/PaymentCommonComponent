import { OneToMany, Entity, Column, PrimaryColumn } from 'typeorm';
import { PaymentEntity } from './payment.entity';

{
  /*
    This entity represents a partial transaction/sales api json to be used in the reconciliation process.
    There are one or more payments associated with a transaction, and each payment should match to a corresponding deposit, either in the CashDeposit or POSDeposit table.    
    The relation to the location entity is required for matching the transaction to a location. and a location to a merchant_id for POS_Deposit, or, pt_location_id for Cash_Deposit.
 */
}
@Entity('transaction')
export class TransactionEntity {
  @PrimaryColumn()
  transaction_id: string;

  @Column()
  transaction_date: Date;

  @Column({ nullable: true })
  transaction_time?: string;

  @Column({ type: 'numeric' })
  payment_total: number;

  @Column({ default: false, nullable: true })
  match?: boolean;

  @Column()
  location_id: number;

  @OneToMany(() => PaymentEntity, (payment) => payment.transaction_id, {
    cascade: true,
    eager: true
  })
  payments?: PaymentEntity[];

  constructor(transaction: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
  }
}
