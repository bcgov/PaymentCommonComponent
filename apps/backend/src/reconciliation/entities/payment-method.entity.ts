import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('payment_method')
export class PaymentMethod {
  @PrimaryColumn()
  code: number;

  @Column()
  type: string;
}
