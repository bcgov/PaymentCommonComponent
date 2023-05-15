import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';

export class SourceDTO {
  @ApiProperty({ description: 'Ministry Code', example: 'SBC' })
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source_id!: string;

  @ApiProperty({ description: 'Location of the office', example: 12 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  location_id!: number;

  @ApiProperty({
    description: 'Method Of Payment',
    example: ['CASH', 'CHQ', 'P', 'M', 'V'],
  })
  @IsString()
  @Length(1, 10)
  // @IsIn(PaymentMethods)
  accepted_payment_methods!: string[];
}
