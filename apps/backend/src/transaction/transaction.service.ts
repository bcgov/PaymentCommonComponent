import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities';
import { PaymentService } from './payment.service';
import { mapLimit } from '../common/promises';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(PaymentService) private readonly paymentService: PaymentService,
    @InjectRepository(TransactionEntity)
    private transactionRepo: Repository<TransactionEntity>
  ) {}

  async saveTransactions(
    data: TransactionEntity[]
  ): Promise<TransactionEntity[]> {
    try {
      const entities = data.map((d) => this.transactionRepo.create(d));
      return mapLimit(entities, (entity) => this.transactionRepo.save(entity));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  async findAllUploadedFiles(): Promise<
    { transaction_source_file_name: string }[]
  > {
    return this.transactionRepo
      .createQueryBuilder('transaction')
      .select('transaction.source_file_name')
      .distinct()
      .getRawMany();
  }
}
