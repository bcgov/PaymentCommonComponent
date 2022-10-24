import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { SalesDTO } from 'src/dto/sales.dto';
import { SalesService } from './sales.service';
import { AppLogger } from '../common/logger.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmptyResponse } from 'src/common/ro/empty-response.ro';

@Controller('sales')
@ApiTags('Sales API')
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService,
    @Inject(Logger) private readonly appLogger: AppLogger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Post Sales Event',
  })
  @ApiResponse({ status: HttpStatus.OK, type: EmptyResponse })
  @HttpCode(HttpStatus.OK)
  async saveSalesEvent(@Body() salesEvent: SalesDTO) {
    this.appLogger.log(salesEvent);
    return this.salesService.saveSalesEvent(salesEvent);
  }
}
