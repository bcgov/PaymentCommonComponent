import { LocationEntity } from './entities/master-location-data.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { LocationService } from './location.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity])],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule]
})
export class LocationModule {}
