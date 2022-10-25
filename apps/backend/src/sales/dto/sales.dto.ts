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
import { AreDistributionsValid } from 'src/sales/decorators/distributionsValidator.decorator';
import { DistributionDTO } from './distribution.dto';


export class SalesDTO {
  @ApiProperty({ description: 'Id', example: 'uuid' })
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

  // 25.25 - Amount
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  total_amount!: number;

  // TODO - Does not validate if the array items don't exist
  @ApiProperty()
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


