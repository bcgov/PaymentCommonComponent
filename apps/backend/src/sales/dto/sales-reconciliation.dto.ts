import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDefined,
  ArrayUnique
} from 'class-validator';
import { PaymentsDTO } from './payment.dto';
import { Type } from 'class-transformer';

export class SalesReconciliationDTO {
  @ApiProperty({
    description: 'id',
    example: '20230103-00025-1000001'
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Agent No.',
    example: '0025'
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({
    description: 'Sales Txn Date',
    example: '2022-11-30-13.33.31.875973'
  })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ description: 'Total Value of the Txn', example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  total!: number;

  @ApiProperty({ description: 'Source ID', example: 'SBC' })
  @IsNumber()
  @IsNotEmpty()
  source_id!: string;

  @ApiProperty({
    type: PaymentsDTO,
    description: 'Payment of total amount by method',
    example: [
      {
        amount: 52.5,
        currency: 'CAD',
        exchange_rate: 0,
        method: '01'
      }
    ]
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PaymentsDTO)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 Payment Method Required'
  })
  @ArrayUnique(
    (o: PaymentsDTO) => {
      return o.method;
    },
    { message: 'Payment Method items must be unique' }
  )
  payments!: PaymentsDTO[];
}
