import { Logger, Module } from '@nestjs/common';
import { TransactionModule } from '../transaction/transaction.module';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';

@Module({
  imports: [TransactionModule],
  controllers: [ParseController],
  providers: [ParseService, Logger],
})
export class ParseModule {}
