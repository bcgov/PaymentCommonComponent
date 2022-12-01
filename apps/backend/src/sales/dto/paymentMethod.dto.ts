import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, Length, IsNumber } from 'class-validator';

export const PaymentMethods = [
  'CASH',
  'CHQ',
  'POS_CREDIT',
  'POS_DEBIT',
  'ONL_CREDIT',
  'ONL_DEBIT'
];

export class PaymentMethodDTO {
  @ApiProperty({ description: 'Amount paid', example: 100.5 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Method Of Payment',
    example: 'CASH',
    enum: PaymentMethods
  })
  @IsString()
  @Length(1, 10)
  @IsIn(PaymentMethods)
  method!: string;
}
