import { Type } from 'class-transformer';
import { PaymentDTO } from './payment.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsOptional,
  Validate,
  ArrayMinSize
} from 'class-validator';
import { ArePaymentMethodsValid } from '../../sales/decorators/arePaymentMethodsValid';

//TODO this is only temporary - remove this once we have the proper sales api data being sent
export class GarmsDTO {
  @ApiProperty({
    description: 'trans_id',
    example: '20221212-00002-1000001'
  })
  @IsString()
  @IsNotEmpty()
  sales_transaction_id!: string;

  @ApiProperty({
    description: 'trans_date',
    example: '2022-12-12-11.57.00.986053'
  })
  @IsString()
  @IsNotEmpty()
  sales_transaction_date!: string;

  @ApiProperty({
    description: 'fiscal close date',
    example: '20221212'
  })
  @IsString()
  @IsNotEmpty()
  fiscal_close_date: string;

  @ApiProperty({
    description: 'payment_total'
  })
  @IsNumber()
  payment_total: number;

  @ApiProperty({
    description: 'void_indicator',
    example: ''
  })
  @IsString()
  @IsOptional()
  void_indicator?: string;

  @ApiProperty({
    description: 'transaction_reference',
    example: ''
  })
  @IsString()
  @IsOptional()
  transaction_reference?: string;

  @ApiProperty({
    description: 'Payment amount and methods'
  })
  @Type(() => PaymentDTO)
  @IsArray()
  @ValidateNested({ each: true })
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
  @Validate(ArePaymentMethodsValid)
  payments: PaymentDTO[];

  @ApiProperty({
    description: 'transaction_reference',
    example: { source: { location_id: '00002' } }
  })
  @ValidateNested({ each: true })
  source: {
    location_id: string;
  };
}
