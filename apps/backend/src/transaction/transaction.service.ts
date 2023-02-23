import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { ReconciliationEvent } from '../reconciliation/const';
import {
  CashPaymentsCashDepositPair,
  PosPaymentPosDepositPair
} from '../reconciliation/reconciliation.interfaces';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(TransactionEntity)
    private transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepo: Repository<PaymentMethodEntity>,
    @Inject(LocationService)
    private locationService: LocationService
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

  // TODO: payment methods service
  public async getPaymentMethodBySBCGarmsCode(
    sbc_code: string
  ): Promise<PaymentMethodEntity> {
    try {
      return await this.paymentMethodRepo.findOneOrFail({
        where: { sbc_code }
      });
    } catch (err) {
      throw err;
    }
  }

  // TODO: move this to payments service
  async queryCashPayments(
    event: ReconciliationEvent
  ): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      relationLoadStrategy: 'join',
      relations: {
        transaction: true,
        payment_method: true
      },
      where: {
        method: Not(In(['AX', 'V', 'P', 'M'])),
        transaction: {
          fiscal_close_date: event.date,
          location_id: event.location_id
        }
      }
    });
  }

  // TODO: move this to payments service
  // TODO: we need the entities, so cannot work with raw queries!
  async queryPosPayments(event: ReconciliationEvent): Promise<PaymentEntity[]> {
    return await this.paymentRepo.find({
      relationLoadStrategy: 'join',
      relations: {
        transaction: true,
        payment_method: true
      },
      where: {
        method: In(['AX', 'V', 'P', 'M']),
        transaction: {
          transaction_date: event.date,
          location_id: event.location_id
        }
      },
      // This is very important for match accuracy, if not ordered, different transaction might match first leading to multi matches
      order: {
        amount: 'ASC',
        method: 'ASC',
        transaction: {
          transaction_time: 'ASC'
        }
      }
    });
  }

  // Error handling?
  async markPosPaymentsAsMatched(
    posPaymentDepostPair: PosPaymentPosDepositPair[]
  ) {
    await Promise.all(
      posPaymentDepostPair.map(async (pair) => {
        const paymentEntity = await this.paymentRepo.findOneByOrFail({
          id: pair.payment.id
        });
        paymentEntity.match = true;
        paymentEntity.deposit_id = `${pair.deposit.id}`;
        return await this.paymentRepo.save(paymentEntity);
      })
    );
  }

  // Error handling?
  async markCashPaymentsAsMatched(
    cashPaymentsCashDepositPair: CashPaymentsCashDepositPair
  ) {
    await Promise.all(
      cashPaymentsCashDepositPair.payments.map(async (payment) => {
        const paymentEntity = await this.paymentRepo.findOneByOrFail({
          id: payment.id
        });
        paymentEntity.match = true;
        paymentEntity.deposit_id = `${cashPaymentsCashDepositPair.deposit.id}`;
        return await this.paymentRepo.save(paymentEntity);
      })
    );
  }
}
