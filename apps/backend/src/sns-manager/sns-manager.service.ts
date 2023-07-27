/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { SNS } from 'aws-sdk';
import { PublishInput } from 'aws-sdk/clients/sns';
import { InjectAwsService } from 'nest-aws-sdk';

@Injectable()
export class SnsManagerService {
  constructor(@InjectAwsService(SNS) public readonly sns: SNS) {}

  /*eslint-disable */
  async publish(
    topic: PublishInput['TopicArn'],
    message: PublishInput['Message']
  ): Promise<SNS.Types.PublishResponse> {
    return await this.sns
      .publish({ TopicArn: topic, Message: message })
      .promise();
  }
}
