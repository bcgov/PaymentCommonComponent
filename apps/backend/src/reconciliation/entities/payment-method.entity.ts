import { Column, PrimaryColumn, Entity } from 'typeorm';

@Entity('payment_method')
export class PaymentMethodEntity {
  @PrimaryColumn({ name: 'method' })
  method: string;

  @Column()
  description: string;

  @Column({ unique: true })
  garms_code: number;

  @Column({ nullable: true })
  card_vendor: string;
}
