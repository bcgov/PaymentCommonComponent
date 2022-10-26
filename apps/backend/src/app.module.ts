import { S3ManagerModule } from './s3-manager/s3-manager.module';
import { FixedWidthRecordModule } from './common/fixedWidthRecord/fixedWidthRecord.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { SalesModule } from './sales/sales.module';
import { FirehoseModule } from './firehose/firehose.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import { Firehose, S3 } from 'aws-sdk';

@Module({
  imports: [
    S3ManagerModule,
    FixedWidthRecordModule,
    SalesModule,
    FirehoseModule,
    ConfigModule.forRoot({
      ignoreEnvFile:
        process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test'
          ? false
          : true,
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        ...(process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test'
          ? {
              endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
              region: 'ca-central-1',
              s3ForcePathStyle: true,
            }
          : {}),
      },
      services: [Firehose, S3],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule {}
