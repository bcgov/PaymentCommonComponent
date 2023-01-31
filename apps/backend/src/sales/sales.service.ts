import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './../pos/entities/pos-deposit.entity';
import { LocationService } from './../location/location.service';

@Injectable()
export class SalesService {
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

  // validateDistributions()
  // TODO update the sales api endpoint distributions data
  async saveSalesEvent(event: any[]) {
    this.appLogger.log(
      event ? 'Sales Event Received' : 'No Sales Event Received'
    );
    return [];
  }

  async createTransaction(data: TransactionEntity): Promise<TransactionEntity> {
    try {
      return await this.transactionRepo.save(this.transactionRepo.create(data));
    } catch (e) {
      this.appLogger.error(e);
      throw e;
    }
  }

  public async getPaymentMethodBySBCGarmsCode(
    sbc_code: number
  ): Promise<PaymentMethodEntity> {
    try {
      return await this.paymentMethodRepo.findOneOrFail({
        where: { sbc_code }
      });
    } catch (err) {
      throw err;
    }
  }

  async queryCashTransactions(
    location_id: number,
    deposit_date: string
  ): Promise<PaymentEntity[]> {
    // TODO  CONVERT TO USE QUERY BUILDER
    return await this.paymentRepo.manager.query(`
      SELECT t.fiscal_date, SUM(p.amount) as amount, STRING_AGG(p.id::varchar, ','::varchar) as ids
      FROM payment p 
      JOIN transaction t on p."transaction" = t.id
      WHERE p.method in(1, 2, 9, 14, 15)
      AND p.amount != 0
	    AND t.location_id = ${location_id}
	    AND t.fiscal_date < '${deposit_date}'
      AND p.match = false
      GROUP BY t.fiscal_date
      ORDER BY t.fiscal_date DESC
    `);
  }

  async queryPOSTransactions(
    location_id: number,
    date: string,
    match: boolean
  ): Promise<PaymentEntity[]> {
    try {
      return await this.paymentRepo.find({
        where: {
          match: match,
          method: In([17, 11, 13, 12, 18, 19]),
          transaction: {
            transaction_date: date,
            location_id
          }
        }
      });
    } catch (err) {
      throw err;
    }
  }

  async markPOSPaymentAsMatched(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): Promise<void> {
    await this.paymentRepo.update(payment.id, {
      match: true,
      pos_deposit_id: deposit.id
    });
  }

  async markCashPaymentAsMatched(payment: any, deposit: any): Promise<any> {
    const { ids } = payment;
    return Promise.all(
      ids.split(',').map(
        async (id: string) =>
          await this.paymentRepo.update(id, {
            match: true,
            cash_deposit_id: deposit.id
          })
      )
    );
  }
}
