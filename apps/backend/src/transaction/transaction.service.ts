import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, TransactionEntity } from './entities';
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
    const insertSingleTransaction = async (
      entity: TransactionEntity
    ): Promise<TransactionEntity> => {
      const savedTransaction = await this.transactionRepo.insert(entity);
      const transaction_id = savedTransaction.identifiers[0].transaction_id;
      const payments = entity.payments.map((p) => {
        const payment = new PaymentEntity(p);
        payment.transaction = {
          ...entity,
          transaction_id,
        };
        return payment;
      });
      await this.paymentService.insertPayments(payments);
      return {
        ...entity,
        transaction_id,
      };
    };

    try {
      const entities = data.map((d) => new TransactionEntity(d));
      return mapLimit(entities, (entity) => insertSingleTransaction(entity));
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
