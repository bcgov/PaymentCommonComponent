import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MinistryLocationEntity,
  LocationEntity,
  BankLocationEntity,
  MerchantEntity,
} from './entities';
import { LocationService } from './location.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([
      MinistryLocationEntity,
      LocationEntity,
      BankLocationEntity,
      MerchantEntity,
    ]),
  ],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
