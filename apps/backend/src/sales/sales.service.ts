import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from 'src/common/logger.service';
import { SalesDTO } from 'src/dto/sales.dto';

@Injectable()
export class SalesService {
    constructor(@Inject(Logger) private readonly appLogger: AppLogger) { }
    async saveSalesEvent(event: SalesDTO) {
        this.appLogger.log(event)
        return;
    }
}
