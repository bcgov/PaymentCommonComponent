import { Column, PrimaryColumn, Entity } from 'typeorm';

@Entity('payment_method')
export class PaymentMethodEntity {
  @PrimaryColumn({ readonly: true })
  method: string;

  @Column({ readonly: true })
  description: string;

  @Column({ unique: true, readonly: true })
  sbc_code: number;
}
