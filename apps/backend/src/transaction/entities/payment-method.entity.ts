import { Column, PrimaryColumn, Entity } from 'typeorm';
import { PaymentMethodClassification } from './../../constants';

@Entity('payment_method')
export class PaymentMethodEntity {
  @PrimaryColumn('varchar', { length: 10, nullable: false })
  method: string;

  @Column('varchar', { length: 50, nullable: true })
  description: string;

  @Column({ type: 'int4', nullable: true })
  sbc_code: number;

  @Column({ enum: PaymentMethodClassification, type: 'enum', nullable: true })
  classification: PaymentMethodClassification;

  constructor(paymentMethod: PaymentMethodEntity) {
    Object.assign(this, paymentMethod);
  }
}
