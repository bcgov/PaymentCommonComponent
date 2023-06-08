import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumberString,
  ValidateNested,
  IsNumber,
  Length,
} from 'class-validator';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';
import { PaymentMethodEntity } from '../../transaction/entities';

export class PosDepositDTO {
  //source file type

  @ApiProperty({ description: 'Merchant ID', example: '22044859' })
  @IsNumber()
  merchant_id!: string;

  @ApiProperty({ description: 'Card Id', example: '***************6194' })
  @IsString()
  @IsNotEmpty()
  @Length(19)
  card_id!: string;

  @ApiProperty({ description: 'Transaction Amount', example: '25.00' })
  @IsNumberString()
  @IsNotEmpty()
  transaction_amt!: string;

  @ApiProperty({ description: 'Transaction Date', example: '2023-01-01' })
  @IsDateString()
  @IsNotEmpty()
  transaction_date!: string;

  @ApiProperty({ description: 'Transaction Time', example: '162000' })
  @IsNumberString()
  transaction_time!: string;

  @ApiProperty({
    description: 'Terminal Number',
    example: 'GA2204318206',
  })
  @IsString()
  @IsNotEmpty()
  terminal_no!: string;

  @ApiProperty({ description: 'Payment Method', type: PaymentMethodEntity })
  @IsNotEmpty()
  payment_method!: PaymentMethodEntity;

  constructor(posDeposit?: Partial<POSDepositEntity>) {
    Object.assign(this, posDeposit);
  }
}

export class PosDepositListDTO {
  @ValidateNested({ each: true })
  list: PosDepositDTO[];

  constructor(posDeposits: PosDepositDTO[]) {
    this.list = posDeposits;
  }
}
