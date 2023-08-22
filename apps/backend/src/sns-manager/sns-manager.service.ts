/*
https://docs.nestjs.com/providers#services
*/

import {
  PublishInput,
  PublishCommandOutput,
  SNSClient,
  PublishCommand,
} from '@aws-sdk/client-sns';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SnsManagerService {
  private sns: SNSClient;
  constructor() {
    this.sns = new SNSClient({
      endpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:9000',
      region: 'ca-central-1',
    });
  }

  /*eslint-disable */
  async publish(
    topic: PublishInput['TopicArn'],
    message: PublishInput['Message']
  ): Promise<PublishCommandOutput> {
    const command = new PublishCommand({ TopicArn: topic, Message: message });
    return await this.sns.send(command);
  }
}
