import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  IsNumber,
  IsNumberString
} from 'class-validator';

/* 
  Chart Of Accounts Definitions: 
  https://www2.gov.bc.ca/gov/content/governments/policies-for-government/core-policy/policies/planning-budgeting-and-reporting#3iii42
*/

export class GlDTO {
  @ApiProperty({
    description:
      '3 character Client Number - the legal entity (Ministry, Trust, Special Account, Special Fund) and the balancing segment in the General Ledger.',
    example: '130'
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  client_code!: string;

  @ApiProperty({
    description:
      '5 Character Responsibility Centre - identifies how the ministry has assigned responsibility and accountability to manage human, financial and capital resources.',
    example: '29KGT'
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  resp_code!: string;

  @ApiProperty({
    description:
      '5 Character Service Line Code -  identifies the ministry program or service at the lowest functional level desired.',
    example: '38513'
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  service_line_code!: string;

  @ApiProperty({
    description:
      '4 Character STOB (Standard Object of Expenditure) -  identifies the nature of goods and services purchased (office supplies, salaries) and the nature of payment (government transfers). Also used to classify transactions according to common characteristics such as expenses, revenue, assets, liabilities and equity.',
    example: '4303'
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  stob_code!: string;

  @ApiProperty({
    description:
      '7 Character Project Code - identifies projects or additional activity detail as defined by ministries or agencies',
    example: '29KGT'
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 7)
  project_code!: string;

  @ApiProperty({
    description:
      ' 6 Character Location Code - (not yet implemented) defines where (the location) the benefit was received as a result of the transaction.',
    example: '000000'
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  location_code!: string;

  @ApiProperty({
    description:
      '5 Character Future Code -  (not yet implemented) segment reserved for future business.',
    example: '0000'
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  future_code!: string;

  // Supplier Code
  @ApiProperty({
    description: 'Free text description of the distribution',
    example: 'lorem ipsum dolor sit amet'
  })
  @IsString()
  @Length(6, 9)
  supplier_code!: string;
}

export class DistributionDTO {
  @ApiProperty({ description: 'Line Number', example: '00001' })
  @IsNumberString({
    no_symbols: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  line_number!: string;

  @ApiProperty({ description: 'Line Amount', example: 50.0 })
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  line_amount!: number;

  @ApiProperty({ description: 'Description', example: 'Description' })
  @IsString()
  @IsNotEmpty()
  line_description!: string;

  @ApiProperty({
    description: 'Disbursment GL Account',
    example: 'Disbursment GL Account',
    type: GlDTO
  })
  @IsNotEmpty()
  disbursment_gl_account!: GlDTO;

  @ApiProperty({
    description: 'Revenue GL Account',
    example: 'Revenue GL Account',
    type: GlDTO
  })
  @IsNotEmpty()
  revenue_gl_account!: GlDTO;
}

export class AccountingDTO {
  @ApiProperty({
    description:
      'Sequential numbers representing an item of sale / service or equivalent',
    example: '00001'
  })
  @IsNumberString({
    no_symbols: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  sequence!: string;

  @ApiProperty({
    description: 'Details'
  })
  @IsNotEmpty()
  details!: unknown[];

  @ApiProperty({
    description: 'Distributions'
  })
  @IsNotEmpty()
  distributions!: DistributionDTO[];
}
