import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './entities/log.entity';
import { AppLogger } from './logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  providers: [AppLogger],
  exports: [AppLogger]
})
export class LoggerModule {}
