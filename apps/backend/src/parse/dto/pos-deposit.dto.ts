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

  @ApiProperty({ description: 'Merchant ID', example: '22099999' })
  @IsNumber()
  merchant_id!: string;

  @ApiProperty({ description: 'Card Id', example: '***************5368' })
  @IsString()
  @IsNotEmpty()
  @Length(19)
  card_id!: string;

  @ApiProperty({ description: 'Transaction Amount', example: '25.00' })
  @IsNumber()
  @IsNotEmpty()
  transaction_amt!: number;

  @ApiProperty({ description: 'Transaction Date', example: '2023-01-01' })
  @IsDateString()
  @IsNotEmpty()
  transaction_date!: string;

  @ApiProperty({ description: 'Transaction Time', example: '162000' })
  @IsNumberString()
  transaction_time!: string;

  @ApiProperty({
    description: 'Terminal Number',
    example: 'GA2209999999',
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
