import { PaymentEntity } from './payment.entity';
import { Column, PrimaryColumn, Entity, OneToOne } from 'typeorm';

@Entity('payment_method')
export class PaymentMethodEntity {
  @PrimaryColumn()
  method: string;

  @Column()
  description: string;

  @OneToOne(() => PaymentEntity, (p) => p.method)
  payment: PaymentEntity;

  @Column({ unique: true })
  sbc_code: number;
}
