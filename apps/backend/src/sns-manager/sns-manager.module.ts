import { Module } from '@nestjs/common';
import { SnsManagerService } from './sns-manager.service';

@Module({
  providers: [SnsManagerService],
  exports: [SnsManagerService],
})
export class SnsManagerModule {}
