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
import { SalesReconciliationDTO } from './dto/sales-reconciliation.dto';
import { SalesService } from './sales.service';
import { AppLogger } from '../common/logger.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmptyResponse } from '../common/ro/empty-response.ro';

@Controller('sale')
@ApiTags('Sales API')
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService,
    @Inject(Logger) private readonly appLogger: AppLogger
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Post Sales Event'
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: EmptyResponse })
  @HttpCode(HttpStatus.CREATED)
  async saveSalesEvent(@Body() salesEvent: SalesReconciliationDTO[]) {
    this.appLogger.log(salesEvent);

    try {
      return this.salesService.saveSalesEvent(salesEvent);
    } catch (e) {
      throw new InternalServerErrorException(
        'An unknown error occured while saving a form'
      );
    }
  }

  @Post('/recon')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Post Sales Reconciliation Event'
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: EmptyResponse })
  @HttpCode(HttpStatus.CREATED)
  async saveReconciliationEvent(@Body() reconEvent: any) {
    this.appLogger.log(reconEvent);

    try {
      return this.salesService.saveReconciliationEvent(reconEvent);
    } catch (e) {
      throw new InternalServerErrorException(
        'An unknown error occured while saving a form'
      );
    }
  }
}
