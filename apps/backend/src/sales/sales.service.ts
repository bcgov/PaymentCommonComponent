import { Inject, Injectable, Logger } from '@nestjs/common';
import { SalesDTO } from './dto/sales.dto';
import { AppLogger } from '../common/logger.service';

@Injectable()
export class SalesService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}

  // validateDistributions()
  // TODO update the sales api endpoint distributions data
  async saveSalesEvent(event: SalesDTO[]) {
    this.appLogger.log(
      event ? 'Sales Event Received' : 'No Sales Event Received'
    );
    return [];
  }
}
