import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from 'src/common/logger.service';
import { SalesDTO } from './dto/sales.dto';
import { FirehoseService } from 'src/firehose/firehose.service';

@Injectable()
export class SalesService {
    constructor(@Inject(Logger) private readonly appLogger: AppLogger,
        @Inject(FirehoseService) private readonly firehoseService: FirehoseService) { }

    
    // validateDistributions()
        
    async saveSalesEvent(event: SalesDTO) {
        this.appLogger.log(event)
        try {
            const puts = await (await this.firehoseService.putRecord(event as unknown as Record<string, string>)).promise();
            console.log(puts)
        } catch (err) {
            this.appLogger.error(err);
        }
        return;
    }
}
