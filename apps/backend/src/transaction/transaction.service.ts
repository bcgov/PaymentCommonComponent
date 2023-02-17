import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity, PaymentEntity } from './entities';
import { PaymentService } from './payment.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import {
  AggregatedPayment,
  CashDepositDates,
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
  ) {
    return await Promise.all(
      posPaymentDepostPair.map(
        async ({ payment, deposit }) =>
          await this.paymentService.markPosPaymentsAsMatched(payment, deposit)
      )
    );
  }

  async findCashPaymentsByDepositDates(
    event: ReconciliationEvent,
    cashDepositDates: CashDepositDates
  ) {
    return await this.paymentService.findCashPaymentsByDepositDates(
      event,
      cashDepositDates
    );
  }

  async updatePaymentStatus(payment: PaymentEntity): Promise<PaymentEntity> {
    return await this.paymentService.updatePayment(payment);
  }

  // Error handling?
  async markCashPaymentsAsMatched(
    aggregatedPayment: AggregatedPayment,
    deposit: CashDepositEntity
  ): Promise<PaymentEntity[]> {
    return await Promise.all(
      aggregatedPayment.payments.map(
        async (payment: PaymentEntity) =>
          await this.paymentService.markCashPaymentsAsMatched(payment, deposit)
      )
    );
  }

  async updateCashPaymentStatus(
    aggregatedPayment: AggregatedPayment
  ): Promise<PaymentEntity[]> {
    return await Promise.all(
      aggregatedPayment.payments.map(
        async (payment: PaymentEntity) =>
          await this.paymentService.updatePayment(payment)
      )
    );
  }
}
