import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsNumber } from 'class-validator';

export class PaymentsDTO {
  @ApiProperty({ description: 'Amount paid', example: 100.5 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Method Of Payment',
    example: '10'
  })
  @IsString()
  @Length(1, 10)
  method!: string;

  @ApiProperty({
    description: 'Exchange rate',
    example: '1.3'
  })
  @IsString()
  @IsOptional()
  exchange_rate!: string;

  @ApiProperty({
    description: 'Method Of Payment',
    example: 'US'
  })
  @IsOptional()
  @IsString()
  currency!: string;
}
