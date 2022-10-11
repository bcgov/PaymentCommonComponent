import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'local' ? false : true,
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        ...process.env.NODE_ENV === 'local' ? {
          endpoint: process.env.AWS_ENDPOINT,
          region: process.env.AWS_REGION
        } : {}
      },
      services: [Firehose],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})

export class AppModule {}
