import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { SalesModule } from './sales/sales.module';
import { FirehoseModule } from './firehose/firehose.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import { Firehose } from 'aws-sdk';

@Module({

  imports: [
    SalesModule, 
    FirehoseModule,
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
      },
      services: [Firehose],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})

export class AppModule {}
