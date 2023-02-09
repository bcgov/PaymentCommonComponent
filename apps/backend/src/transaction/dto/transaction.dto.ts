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
  IsBoolean
} from 'class-validator';
import { AccountingDTO } from './accounting.dto';
import { PaymentDTO } from './payment.dto';
import { SourceDTO } from './source.dto';

export class TransactionDTO {
  @ApiProperty({
    description: 'Unique id representing the transaction in the source system',
    example: '264595a1-4775-4bfe-9b3a-358bbbb5c4f7'
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'Transaction Date', example: '2022-10-25' })
  @IsString()
  @IsNotEmpty()
  @IsDateString({
    strict: true
  })
  transaction_date!: string;

  @ApiProperty({ description: 'Transaction Time', example: '13.33.31.875973' })
  @IsString()
  @IsNotEmpty()
  transaction_time!: string;

  @ApiProperty({ description: 'Fiscal Close Date', example: '2022-10-25' })
  @IsString()
  @IsNotEmpty()
  @IsDateString({
    strict: true
  })
  fiscal_close_date!: string;

  @ApiProperty({ description: 'Total Value of the Txn', example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  total_payment_amount!: number;

  @ApiProperty({ description: 'Transaction Cancelled', example: true })
  @IsBoolean()
  void_indicator!: boolean;

  @ApiProperty({ description: 'Misc Properties', example: true })
  @IsBoolean()
  miscellaneous!: unknown;

  @ApiProperty({
    description: 'Source of the Transaction'
  })
  @IsNotEmpty()
  @Type(() => SourceDTO)
  source!: SourceDTO;

  @ApiProperty({
    type: PaymentDTO,
    description: 'Payment of total amount by method'
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PaymentDTO)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 Payment Method Required'
  })
  @ArrayUnique(
    (o: PaymentDTO) => {
      return o.method;
    },
    { message: 'Payment Method items must be unique' }
  )
  // @Validate(ArePaymentMethodsValid)
  payments!: PaymentDTO[];

  @ApiProperty({
    type: AccountingDTO,
    description:
      'Distribution of funds to other ministries and program areas by GL codes',
    example: []
  })
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingDTO)
  // @IsNotEmpty()
  // @ArrayNotEmpty({ message: 'Accounting is required and must not be empty' })
  // @Validate(AreDistributionsValid)
  accounting!: AccountingDTO[];
}
