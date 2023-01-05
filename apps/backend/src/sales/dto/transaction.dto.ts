import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  IsDefined,
  ArrayUnique,
  Validate
} from 'class-validator';
import { PaymentDTO } from './payment.dto';
import { ArePaymentMethodsValid } from '../decorators/arePaymentMethodsValid';
import { PaymentMethodDTO } from './paymentMethod.dto';

export class TransactionDTO {
  @ApiProperty({
    description: 'agent_id-location-date-time',
    example: '264595a1-0010-202210101532'
  })
  @IsString()
  @IsNotEmpty()
  transaction_id!: string;

  @ApiProperty({ description: 'Transaction Date', example: '2022-10-25' })
  @IsString()
  @IsNotEmpty()
  @IsDateString({
    strict: true
  })
  transaction_date!: string;

  @ApiProperty({ description: 'Transaction Time', example: '12:00' })
  @IsString()
  @IsNotEmpty()
  transaction_time!: string;

  // 150.50 - Amount
  @ApiProperty({ description: 'Total Value of the Txn', example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  payment_total!: number;

  @ApiProperty({
    type: PaymentDTO,
    description: 'Payment amount and methods',
    example: [
      {
        currency: 'CAD',
        exchange_rate: 1,
        amount: 100,
        method: 'CASH'
      },
      {
        currency: 'USD',
        exchange_rate: 1.25,
        amount: 50.5,
        method: 'POS_CREDIT'
      }
    ]
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDTO)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 Payment Method Required'
  })
  @ArrayUnique(
    (o: PaymentMethodDTO) => {
      return o.method;
    },
    { message: 'Payment Method items must be unique' }
  )
  @Validate(ArePaymentMethodsValid)
  payments: PaymentDTO[];
}
