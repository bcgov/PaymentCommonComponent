import { UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Type } from 'class-transformer';
import { PaymentDTO } from './payment.dto';
import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';

//TODO replace the garms DTO with this one after sales api endpoints are enabled
@UseInterceptors(ClassSerializerInterceptor)
export class TransactionDTO {
  @IsString()
  transaction_id: string;

  @IsString()
  transaction_date!: string;

  @IsString()
  fiscal_close_date: string;

  @IsNumber()
  payment_total: number;

  @IsString()
  @IsOptional()
  void_indicator?: string;

  @IsString()
  @IsOptional()
  transaction_reference?: string;

  @Type(() => PaymentDTO)
  @IsArray()
  payments: PaymentDTO[];

  @IsNumber()
  location_id: number;

  constructor(data?: any) {
    Object.assign(this, data);
  }
}
