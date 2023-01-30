import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PosService } from './pos.service';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LocationModule, TypeOrmModule.forFeature([POSDepositEntity])],
  providers: [PosService, Logger],
  exports: [PosService, TypeOrmModule]
})
export class PosModule {}
