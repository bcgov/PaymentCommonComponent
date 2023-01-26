import { S3ManagerModule } from './s3-manager/s3-manager.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { SalesModule } from './sales/sales.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    S3ManagerModule,
    ReconciliationModule,
    SalesModule,
    ConfigModule.forRoot({
      ignoreEnvFile:
        process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'ci'
          ? false
          : true
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        ...(process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'ci'
          ? {
              endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000',
              region: 'ca-central-1',
              s3ForcePathStyle: true
            }
          : {})
      },
      services: [S3]
    })
  ],
  controllers: [AppController],
  providers: [AppService, AppLogger]
})
export class AppModule {}
