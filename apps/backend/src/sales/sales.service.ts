import { Inject, Injectable, Logger } from '@nestjs/common';
import { SalesDTO } from './dto/sales.dto';
import { AppLogger } from '../common/logger.service';
import { FirehoseService } from '../firehose/firehose.service';
import { parseGarms } from '../lambdas/utils/parseGarms';

@Injectable()
export class SalesService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(FirehoseService) private readonly firehoseService: FirehoseService
  ) {}

  // validateDistributions()
  // TODO update the sales api endpoint distributions data
  async saveSalesEvent(event: SalesDTO[]) {
    this.appLogger.log(event);
    try {
      await (
        await this.firehoseService.putRecord(
          parseGarms(event) as unknown as Record<string, string>
        )
      ).promise();
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
    return;
  }
}
