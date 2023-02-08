import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { TransactionDTO } from './dto/transaction.dto';
import { TransactionService } from './transaction.service';
import { AppLogger } from '../logger/logger.service';
import transactionJson from '../../sample-files/transaction.json';
@Controller('sale')
@ApiTags('Sales API')
export class TransactionController {
  constructor(
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Post Sales Event'
  })
  @ApiBody({
    schema: {
      example: transactionJson
    }
  })
  @ApiResponse({
    description: 'Returns the parsed sales reconciliation data',
    schema: {
      example: {
        data: []
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async saveTransactionEvent(@Body() transactionEvent: TransactionDTO[]) {
    try {
      this.appLogger.log(transactionEvent);
      // TODO: Persist To The Database
      // IF void is true, then UPDATE the transaction and don't create a new one
    } catch (e) {
      throw new InternalServerErrorException(
        'An unknown error occured while saving event'
      );
    }
  }
}
