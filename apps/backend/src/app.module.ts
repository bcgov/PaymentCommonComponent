import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule {}
