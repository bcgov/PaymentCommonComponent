import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsIn,
  IsString,
  Length,
  IsDateString,
  IsNumber,
  IsNumberString,
} from 'class-validator';

/* 
  Chart Of Accounts Definitions: 
  https://www2.gov.bc.ca/gov/content/governments/policies-for-government/core-policy/policies/planning-budgeting-and-reporting#3iii42
*/
export class DistributionDTO {
  // 00001
  @ApiProperty({
    description: 'Sequential 5 digit line numbers',
    example: '00001',
  })
  @IsNumberString({
    no_symbols: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  line_number!: string;

  // 130 - Agriculture
  @ApiProperty({
    description:
      '3 character Client Number - the legal entity (Ministry, Trust, Special Account, Special Fund) and the balancing segment in the General Ledger.',
    example: '130',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  dist_client_code!: string;

  // 29KGT - Resp Code
  @ApiProperty({
    description:
      '5 Character Responsibility Centre - identifies how the ministry has assigned responsibility and accountability to manage human, financial and capital resources.',
    example: '29KGT',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  dist_resp_code!: string;

  // 38513 - Line Code
  @ApiProperty({
    description:
      '5 Character Service Line Code -  identifies the ministry program or service at the lowest functional level desired.',
    example: '38513',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  dist_service_line_code!: string;

  // 4303 - STOB
  @ApiProperty({
    description:
      '4 Character STOB (Standard Object of Expenditure) -  identifies the nature of goods and services purchased (office supplies, salaries) and the nature of payment (government transfers). Also used to classify transactions according to common characteristics such as expenses, revenue, assets, liabilities and equity.',
    example: '4303',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  dist_stob_code!: string;

  // 29K0230 - Project Code
  @ApiProperty({
    description: '7 Character Project Code - identifies projects or additional activity detail as defined by ministries or agencies',
    example: '29KGT',
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 7)
  dist_project_code!: string;

  // 000000 - Location Code
  @ApiProperty({
    description: ' 6 Character Location Code - (not yet implemented) defines where (the location) the benefit was received as a result of the transaction.',
    example: '000000',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  dist_location_code!: string;

  // 0000 - Future Code
  @ApiProperty({
    description: '5 Character Future Code -  (not yet implemented) segment reserved for future business.',
    example: '0000',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  dist_future_code!: string;

  // 25.25 - Line Amount
  @ApiProperty({
    description: 'Distribution amount to the CoA',
    example: 50.00,
  })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  line_amount!: number;

  // C or D - Credit or Debit
  @ApiProperty({
    description: 'Credit or Debit Indicator',
    example: 50.00,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['C', 'D'])
  line_code!: string;

  //
  @ApiProperty({
    description: 'Free text description of the distribution',
    example: "lorem ipsum dolor sit amet",
  })
  @IsString()
  @Length(0, 100)
  @Length(0, 100)
  line_description!: string;

  // GL Effective Date
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  gl_date!: Date;

  // Supplier Code
  @ApiProperty({
    description: 'Free text description of the distribution',
    example: "lorem ipsum dolor sit amet",
  })
  @IsString()
  @Length(6, 9)
  supplier_code!: string;
}
