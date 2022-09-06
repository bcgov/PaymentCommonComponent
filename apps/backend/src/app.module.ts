import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { Nats } from './nats/nats.service';

@Module({
  imports: [Nats],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule {}
