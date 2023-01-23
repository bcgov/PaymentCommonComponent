import { Column, PrimaryColumn, Entity } from 'typeorm';

@Entity('payment_method')
export class PaymentMethodEntity {
  @PrimaryColumn()
  method: string;

  @Column()
  description: string;

  @Column({ unique: true })
  sbc_code: number;
}
