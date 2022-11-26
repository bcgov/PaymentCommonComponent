import { S3ManagerService } from './s3-manager.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [S3ManagerService],
  exports: [S3ManagerService],
})
export class S3ManagerModule {}
