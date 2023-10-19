import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MasterLocationEntity,
  LocationEntity,
  BankLocationEntity,
  MerchantLocationEntity,
} from './entities';
import { LocationService } from './location.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([
      MasterLocationEntity,
      LocationEntity,
      BankLocationEntity,
      MerchantLocationEntity,
    ]),
  ],
  providers: [LocationService],
  exports: [LocationService, TypeOrmModule],
})
export class LocationModule {}
