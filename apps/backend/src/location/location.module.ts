import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LocationEntity,
  MasterDataLocationEntity,
  MerchantLocationEntity,
} from './entities';
import { LocationService } from './location.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([
      LocationEntity,
      MasterDataLocationEntity,
      MerchantLocationEntity,
    ]),
  ],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
