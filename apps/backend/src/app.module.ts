import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './common/logger.service';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})

export class AppModule {}
