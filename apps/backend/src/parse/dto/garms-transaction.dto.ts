import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transaction } from '../../transaction/interface/transaction.interface';
import { TransactionEntity } from '../../transaction/entities/transaction.entity';
import { PaymentDTO } from '../../transaction/dto/payment.dto';
import { GarmsPaymentDTO } from './garms-payment.dto';
import { PaymentEntity } from '../../transaction/entities';

export class GarmsTransactionDTO {
  @ApiProperty({
    description: 'Unique id representing the transaction in the source system',
    example: '264595a1-4775-4bfe-9b3a-358bbbb5c4f7',
  })
  @IsString()
  @IsNotEmpty()
  transaction_id!: string;

  @ApiProperty({ description: 'Transaction Date', example: '2022-10-25' })
  @IsString()
  @IsNotEmpty()
  @IsDateString({
    strict: true,
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
    strict: true,
  })
  fiscal_close_date!: string;

  @ApiProperty({ description: 'Total Value of the Txn', example: 150.5 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  total_transaction_amount!: number;

  @ApiProperty({ description: 'Transaction Cancelled', example: true })
  @IsBoolean()
  void_indicator?: boolean = false;

  @ApiProperty({ description: 'Program Source ID', example: 'SBC' })
  @IsString()
  @IsNotEmpty()
  source_id!: string;

  @ApiProperty({ description: 'Location ID', example: '47' })
  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @ApiProperty({ description: 'TransactionJSON', type: Transaction })
  transactionJson: Transaction;

  @ApiProperty({ description: 'Migrated', example: false })
  migrated: boolean = false;

  @ApiProperty({
    description: 'Source File Name',
    example: 'sbc/SBC_SALES_2023_05_08_23_18_08.JSON',
  })
  @IsOptional()
  source_file_name?: string;

  @ApiProperty({ description: 'Payments', type: GarmsPaymentDTO })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GarmsPaymentDTO)
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 Payment Method Required',
  })
  @ArrayUnique(
    (o: GarmsPaymentDTO) => {
      return o.payment_method;
    },
    { message: 'Payment Method items must be unique' }
  )
  payments!: GarmsPaymentDTO[];

  constructor(transaction?: Partial<TransactionEntity>) {
    Object.assign(this, transaction);
    this.payments =
      transaction?.payments?.map((p) => new GarmsPaymentDTO(p)) || [];
  }
}

export class GarmsTransactionList {
  @ValidateNested({ each: true })
  list: GarmsTransactionDTO[];

  constructor(transactions: GarmsTransactionDTO[]) {
    this.list = transactions;
  }
}
