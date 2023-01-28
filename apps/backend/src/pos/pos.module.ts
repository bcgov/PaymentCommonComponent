import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PosService } from './pos.service';

@Module({
  imports: [TypeOrmModule.forFeature([POSDepositEntity])],
  providers: [PosService, Logger],
  exports: [PosService, TypeOrmModule]
})
export class PosModule {}
