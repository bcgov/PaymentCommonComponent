import { Logger, Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { S3ManagerModule } from '../s3-manager/s3-manager.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [S3ManagerModule, UploadsModule],
  providers: [AlertsService, Logger],
  exports: [AlertsService],
})
export class AlertsModule {}
