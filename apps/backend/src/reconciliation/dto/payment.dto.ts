import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class PaymentDTO {
  @ApiProperty({ description: 'exchange_rate', example: 1.5 })
  @IsNumber()
  @IsOptional()
  exchange_rate?: number;

  @ApiProperty({ description: 'Currency', example: 'CAD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Method Of Payment',
    example: '01'
    // enum: PaymentMethods
  })
  @IsString()
  method: string;

  @ApiProperty({ description: 'Amount paid', example: 100.5 })
  @IsNumber()
  amount: number;
}
