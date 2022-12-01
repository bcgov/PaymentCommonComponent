import { Module } from '@nestjs/common';
import { FirehoseService } from './firehose.service';

@Module({
  providers: [FirehoseService],
  exports: [FirehoseService]
})
export class FirehoseModule {}
