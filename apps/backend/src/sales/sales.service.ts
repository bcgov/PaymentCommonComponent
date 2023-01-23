import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../common/logger.service';

@Injectable()
export class SalesService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}

  // validateDistributions()
  // TODO update the sales api endpoint distributions data
  async saveSalesEvent(event: any[]) {
    this.appLogger.log(
      event ? 'Sales Event Received' : 'No Sales Event Received'
    );
    return [];
  }
}
