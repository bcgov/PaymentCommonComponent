import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity, PaymentEntity } from './entities';
import { PaymentService } from './payment.service';
import { MatchStatus } from '../common/const';
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

  async saveTransactions(data: TransactionEntity[]) {
    try {
      const entities = data.map((d) => this.transactionRepo.create(d));
      return await this.transactionRepo.save(entities);
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }
  async saveTransaction(data: TransactionEntity): Promise<TransactionEntity> {
    try {
      return await this.transactionRepo.save(this.transactionRepo.create(data));
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
    return await this.paymentService.findPosPayments(event);
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

  async findPaymentsExceptions(
    event: ReconciliationEvent,
    pastDueDepositDate: string
  ): Promise<PaymentEntity[]> {
    return await this.paymentService.findPaymentsExceptions(
      event,
      pastDueDepositDate
    );
  }

  async findCashPayments(
    event: ReconciliationEvent,
    status: MatchStatus
  ): Promise<PaymentEntity[]> {
    return await this.paymentService.findCashPayments(event, status);
  }
  public aggregatePayments(payments: PaymentEntity[]) {
    return this.paymentService.aggregatePayments(payments);
  }

  //TODO - Remove this and call the Payment Service directly from the POS/Cash reconciliation service

  async updatePayments(
    payments: PaymentEntity[],
    status: MatchStatus
  ): Promise<PaymentEntity[]> {
    this.appLogger.log(
      `UPDATE PAYMENT STATUS: ${
        payments.length
      } SET TO -> ${status.toUpperCase()}`,
      PaymentService.name
    );

    return await Promise.all(
      payments.map(
        async (payment) =>
          await this.paymentService.updatePayment({
            ...payment,
            timestamp: payment.timestamp,
            status
          })
      )
    );
  }
  async updatePaymentStatus(payment: PaymentEntity): Promise<PaymentEntity> {
    return await this.paymentService.updatePayment(payment);
  }
}
