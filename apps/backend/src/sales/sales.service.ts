import { SalesReconciliationDTO } from './dto/sales-reconciliation.dto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../common/logger.service';
import { FirehoseService } from '../firehose/firehose.service';
import { handler } from '../scripts/parsegarms';

@Injectable()
export class SalesService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(FirehoseService) private readonly firehoseService: FirehoseService
  ) {}

  // validateDistributions()
  // TODO update the sales api endpoint to include the distributions data
  async saveSalesEvent(event: SalesReconciliationDTO[]) {
    this.appLogger.log(event);
    try {
      await (
        await this.firehoseService.putRecord(
          event as unknown as Record<string, string>
        )
      ).promise();
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
    return;
  }

  async saveReconciliationEvent(event: any) {
    this.appLogger.log(event);
    // TODO replace this with the code below once we  no longer need to runa script with the proper data
    handler(event);
    // try {
    //   await (
    //     await this.firehoseService.putRecord(
    //       event as unknown as Record<string, string>
    //     )
    //   ).promise();
    // } catch (err) {
    //   this.appLogger.error(err);
    //   throw err;
    // }
    // return;
  }
}
