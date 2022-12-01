import { Injectable } from '@nestjs/common';
import { InjectAwsService } from 'nest-aws-sdk';
import { Firehose } from 'aws-sdk';

@Injectable()
export class FirehoseService {
  constructor(
    @InjectAwsService(Firehose) private readonly firehose: Firehose
  ) {}
  async putRecord(event: Record<string, string>) {
    const putRecordData: Firehose.PutRecordInput = {
      DeliveryStreamName: 'SalesDelivery',
      Record: {
        Data: JSON.stringify(event)
      }
    };
    return this.firehose.putRecord(putRecordData);
  }
}
