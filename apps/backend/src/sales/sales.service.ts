import { Inject, Injectable, Logger } from '@nestjs/common';
import { SalesDTO } from './dto/sales.dto';
import { AppLogger } from '../common/logger.service';
import { parseGarms } from '../lambdas/utils/parseGarms';

@Injectable()
export class SalesService {
  constructor(@Inject(Logger) private readonly appLogger: AppLogger) {}

  // validateDistributions()
  // TODO update the sales api endpoint distributions data
  async saveSalesEvent(event: SalesDTO[]) {
    this.appLogger.log(event);
    // Temporary response body TODO update sales api
    return parseGarms(event);
  }
}
