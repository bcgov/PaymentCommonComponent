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
import { AppLogger } from '../common/logger.service';
import { SalesService } from './sales.service';

import transactionJson from '../../sample-files/transaction.json'; 
import { SalesDTO } from './dto/sales.dto';
@Controller('sale')
@ApiTags('Sales API')
export class SalesController {
  constructor(
    @Inject(SalesService)
    private readonly salesService: SalesService,
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
  async saveSalesEvent(@Body() salesEvent: SalesDTO[]) {
    try {
      this.appLogger.log(salesEvent);
      // return this.salesService.saveSalesEvent(salesEvent);
    } catch (e) {
      throw new InternalServerErrorException(
        'An unknown error occured while saving event'
      );
    }
  }
}
