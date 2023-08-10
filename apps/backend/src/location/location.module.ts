import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './entities/master-location-data.entity';
import { LocationService } from './location.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([LocationEntity])],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
