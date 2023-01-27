import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSDepositEntity } from '../reconciliation/entities';
import { PosService } from './pos.service';

@Module({
  imports: [TypeOrmModule.forFeature([POSDepositEntity])],
  providers: [PosService, Logger],
  exports: [PosService]
})
export class PosModule {}
