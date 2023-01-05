import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsNumber
} from 'class-validator';

export const PaymentMethods = [
  'CASH',
  'CHQ',
  'POS_CREDIT',
  'POS_DEBIT',
  'ONL_CREDIT',
  'ONL_DEBIT'
];

export class PaymentDTO {
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

  @ApiProperty({ description: 'exchange_rate', example: 1.5 })
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  exchange_rate?: number;

  @ApiProperty({ description: 'Currency', example: 'CAD' })
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  currency?: string;
}
