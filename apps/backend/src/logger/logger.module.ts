import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { transports } from 'winston';
import { AppLogger } from './logger.service';

@Module({
  imports: [WinstonModule.forRoot(new transports.Console())],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
