import { Logger, Module } from '@nestjs/common';
import { FirehoseModule } from '../firehose/firehose.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [FirehoseModule],
  controllers: [SalesController],
  providers: [SalesService, Logger]
})
export class SalesModule {}
