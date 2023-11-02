import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities';
import { PaymentService } from './payment.service';
import { mapLimit } from '../common/promises';
import { Ministries } from '../constants';
import datasource from '../database/datasource';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(PaymentService) private readonly paymentService: PaymentService,
    @InjectRepository(TransactionEntity)
    private transactionRepo: Repository<TransactionEntity>,
    @Inject(AppLogger) private readonly appLogger: AppLogger
  ) {
    this.appLogger.setContext(TransactionService.name);
  }

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

  async updateAndSaveTxns(data: TransactionEntity[]): Promise<void> {
    const queryRunner = datasource.createQueryRunner();

    // establish real database connection
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(data);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
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

  async findWithNullLocation(
    program: Ministries
  ): Promise<TransactionEntity[]> {
    return await this.transactionRepo.find({
      where: { source_id: program, location: undefined },
    });
  }
}
