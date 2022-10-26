import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Length,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  IsDefined,
  ArrayUnique,
  Validate,
} from 'class-validator';
import { AreDistributionsValid } from '../decorators/areDistributionsValid';
import { ArePaymentMethodsValid } from '../decorators/arePaymentMethodsValid';
import { DistributionDTO } from './distribution.dto';
import { PaymentMethodDTO } from './paymentMethod.dto';

export class SalesDTO {
  @ApiProperty({
    description: 'Id',
    example: '264595a1-4775-4bfe-9b3a-358bbbb5c4f7',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'Sales Txn Date', example: '2022-10-25' })
  @IsString()
  @IsNotEmpty()
  @IsDateString({
    strict: true,
  })
  sale_date!: string;

  @ApiProperty({
    description:
      'Journal Name - Prefixed with 2 character Ministry Alpha identifier',
    example: 'SM J000001',
  })
  @IsString()
  @IsNotEmpty()
  journal_name!: string;

  @ApiProperty({ description: 'Ministry Alpha Identifier', example: 'SM' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  ministry_alpha_identifier!: string;

  // 150.50 - Amount
  @ApiProperty({ description: 'Total Value of the Txn', example: 150.50 })
  @IsNumber()
  @IsNotEmpty()
  total_amount!: number;


  @ApiProperty({
    type: PaymentMethodDTO,
    description: 'Payment of total amount by method',
    example: [
      {
        amount: 100,
        method: 'CASH',
      },
      {
        amount: 50.5,
        method: 'POS_CREDIT',
      },
    ],
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDTO)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 Payment Method Required',
  })
  @ArrayUnique(
    (o: PaymentMethodDTO) => {
      return o.method;
    },
    { message: 'Payment Method items must be unique' },
  )
  @Validate(ArePaymentMethodsValid)
  payment_method!: PaymentMethodDTO[];

  @ApiProperty({
    type: DistributionDTO,
    description:
      'Distribution of funds to other ministries and program areas by GL codes',
    example: [
      {
        line_number: '00001',
        dist_client_code: '130',
        dist_resp_code: '29KGT',
        dist_service_line_code: '38513',
        dist_stob_code: '4303',
        dist_project_code: '29K0230',
        dist_location_code: '000000',
        dist_future_code: '0000',
        line_amount: 150.50,
        line_code: 'C',
        line_description:
          'GA OFF# 00002 2022-08-05                    *900100002',
        gl_date: '2022-10-12',
        supplier_code: 'xxxxxx'
      },
      {
        line_number: '00002',
        dist_client_code: '074',
        dist_resp_code: '32L14',
        dist_service_line_code: '58200',
        dist_stob_code: '1461',
        dist_project_code: '3200000',
        dist_location_code: '000000',
        dist_future_code: '0000',
        line_amount: 150.50,
        line_code: 'D',
        line_description: 'GA OFF# 00014 2022-08-05',
        gl_date: '2022-10-12',
        supplier_code: 'xxxxxx'
      },
    ],
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DistributionDTO)
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least 2 distributions are required (1 credit and 1 debit)',
  })
  @ArrayNotEmpty({ message: 'distributions is required and must not be empty' })
  @ArrayUnique(
    (o: DistributionDTO) => {
      return o.line_number;
    },
    { message: 'distribution line numbers must be unique' },
  )
  @Validate(AreDistributionsValid)
  distributions!: DistributionDTO[];
}
