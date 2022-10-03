
import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, HttpStatus, Inject, Logger, Post, UseInterceptors } from '@nestjs/common';
import { SalesDTO } from 'src/dto/sales.dto';
import { SalesService } from './sales.service';
import { AppLogger } from '../common/logger.service';

@Controller('sales')
export class SalesController {

    constructor(
        @Inject(SalesService) private readonly salesService: SalesService,
        @Inject(Logger) private readonly appLogger: AppLogger) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(ClassSerializerInterceptor)
    async saveSalesEvent(@Body() salesEvent: SalesDTO) {
        this.appLogger.log(salesEvent)
        return this.salesService.saveSalesEvent(salesEvent);
    }
}
