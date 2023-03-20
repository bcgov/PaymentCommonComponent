import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity, PaymentEntity } from './entities';
import { PaymentService } from './payment.service';
import { mapLimit } from '../common/promises';
import { AppLogger } from '../logger/logger.service';
import {
  PosPaymentPosDepositPair,
  ReconciliationEvent
} from '../reconciliation/types';

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

  async findPosPayments(event: ReconciliationEvent) {
    return await this.paymentService.findPosPayments(
      event.location,
      event.date
    );
  }

  // Error handling?
  async markPosPaymentsAsMatched(
    posPaymentDepostPair: PosPaymentPosDepositPair[]
  ): Promise<PaymentEntity[]> {
    return await Promise.all(
      posPaymentDepostPair.map(
        async ({ payment, deposit }) =>
          await this.paymentService.markPosPaymentsAsMatched(payment, deposit)
      )
    );
  }

  //TODO - Remove this and call the Payment Service directly from the POS reconciliation service
  async updatePaymentStatus(payment: PaymentEntity): Promise<PaymentEntity> {
    return await this.paymentService.updatePayment(payment);
  }
}
