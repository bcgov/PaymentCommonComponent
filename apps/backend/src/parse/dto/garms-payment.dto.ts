import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { PaymentEntity, PaymentMethodEntity } from '../../transaction/entities';

export class GarmsPaymentDTO {
  @ApiProperty({ description: 'Amount paid in CAD', example: 134.5 })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Foreign currency amount', example: 100.0 })
  @IsNumber()
  @IsOptional()
  foreign_currency_amount?: number;

  @ApiProperty({ description: 'Currency of payment', example: 'CAD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ description: 'Exchange Rate', example: 1.345 })
  @IsNumber()
  @IsOptional()
  exchange_rate?: number;

  @ApiProperty({ description: 'Payment Method', type: PaymentMethodEntity })
  @IsNotEmpty()
  payment_method!: PaymentMethodEntity;

  constructor(payment?: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
