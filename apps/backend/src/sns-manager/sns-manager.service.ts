/*
https://docs.nestjs.com/providers#services
*/

import { PublishInput, PublishCommandOutput, SNS } from '@aws-sdk/client-sns';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SnsManagerService {
  private sns: SNS;
  constructor() {
    this.sns = new SNS({
      endpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:9000',
      region: 'ca-central-1',
    });
  }

  /*eslint-disable */
  async publish(
    topic: PublishInput['TopicArn'],
    message: PublishInput['Message']
  ): Promise<PublishCommandOutput> {
    return await this.sns.publish({ TopicArn: topic, Message: message });
  }
}
