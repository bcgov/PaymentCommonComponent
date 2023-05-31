import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { PaymentEntity, PaymentMethodEntity } from '../../transaction/entities';
import { PaymentChannel } from '../../transaction/interface/transaction.interface';

export class GarmsPaymentDTO {
  @ApiProperty({ description: 'Amount paid in CAD', example: 134.5 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Foreign currency amount', example: 100.0 })
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  foreign_currency_amount?: number;

  @ApiProperty({ description: 'Currency of payment', example: 'CAD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ description: 'Exchange Rate', example: 1.345 })
  @IsNumber()
  @IsNotEmpty()
  exchange_rate!: number;

  @ApiProperty({
    description: 'Channel',
    example: 'in-person',
    enum: PaymentChannel,
  })
  @IsString()
  @IsNotEmpty()
  channel!: string;

  @ApiProperty({ description: 'Card Number', example: '1234' })
  @IsString()
  @IsNotEmpty()
  card_no!: string;

  @ApiProperty({ description: 'Merchant ID', example: 'ABCD1234' })
  @IsString()
  @IsNotEmpty()
  merchant_id!: string;

  @ApiProperty({ description: 'Device ID', example: 'ABCD1234' })
  @IsString()
  @IsNotEmpty()
  device_id!: string;

  @ApiProperty({ description: 'Invoice Number', example: 'ABCD1234' })
  @IsString()
  @IsNotEmpty()
  invoice_no!: string;

  @ApiProperty({ description: 'Transaction ID', example: 'ABCD1234' })
  @IsString()
  @IsNotEmpty()
  tran_id!: string;

  @ApiProperty({ description: 'Order Number', example: 'ABCD1234' })
  @IsString()
  @IsNotEmpty()
  order_no!: string;

  @ApiProperty({ description: 'Payment Method', type: PaymentMethodEntity })
  @IsNotEmpty()
  payment_method!: PaymentMethodEntity;

  constructor(payment?: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }
}
