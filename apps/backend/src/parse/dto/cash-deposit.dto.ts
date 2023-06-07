import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumberString,
  ValidateNested,
} from 'class-validator';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';

export class CashDepositDTO {
  //source file type

  @ApiProperty({ description: 'Program Code', example: '0070' })
  @IsString()
  @IsOptional()
  program_code?: string;

  @ApiProperty({ description: 'Deposit date', example: '2023-01-01' })
  @IsDateString()
  @IsNotEmpty()
  deposit_date!: string;

  @ApiProperty({ description: 'Pt Location Id', example: '20094' })
  @IsNumberString()
  @IsNotEmpty()
  pt_location_id!: string;

  @ApiProperty({ description: 'Deposit time', example: '162600' })
  @IsNumberString()
  @IsNotEmpty()
  deposit_time!: string;

  @ApiProperty({ description: 'Seuence Number', example: '001' })
  @IsNumberString()
  @IsNotEmpty()
  seq_no!: string;

  @ApiProperty({
    description: 'Location Description',
    example: 'SERVICE BC VICTORIA',
  })
  @IsString()
  @IsNotEmpty()
  location_desc!: string;

  @ApiProperty({ description: 'Deposit amount curr', example: '100.00' })
  @IsNumberString()
  @IsNotEmpty()
  deposit_amt_curr!: string;

  @ApiProperty({ description: 'Exchange Adjusted Amount', example: '0.00' })
  @IsNumberString()
  @IsNotEmpty()
  exchange_adj_amt!: string;

  @ApiProperty({ description: 'Deposit amount Canadian', example: '100.00' })
  @IsNumberString()
  @IsNotEmpty()
  deposit_amt_cdn!: string;

  @ApiProperty({ description: 'Destination Bank Number', example: '0010' })
  @IsNumberString()
  @IsNotEmpty()
  destination_bank_no!: string;

  constructor(cashDeposit?: Partial<CashDepositEntity>) {
    Object.assign(this, cashDeposit);
  }
}

export class CashDepositsListDTO {
  @ValidateNested({ each: true })
  list: CashDepositDTO[];

  constructor(cashDeposits: CashDepositDTO[]) {
    this.list = cashDeposits;
  }
}
