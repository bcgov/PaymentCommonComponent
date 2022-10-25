import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  Length,
  IsNumber,
} from 'class-validator';

export class PaymentMethodDTO {
  @ApiProperty({ description: 'Amount paid', example: 100.50 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  
  @ApiProperty()
  @IsString()
  @Length(1, 10)
  @IsIn(['CASH', 'CHQ', 'POS_CREDIT', 'POS_DEBIT', 'ONL_CREDIT', 'ONL_DEBIT'])
  method!: string;
}
