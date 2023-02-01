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
    return await this.transactionRepo.manager.query(`
      SELECT
	      t.fiscal_date,    
	      SUM(p.amount),
	      STRING_AGG(p.id::varchar, ','::varchar) as ids
      FROM
	      transaction t
      JOIN payment p 
      ON
	      p.transaction = t.id
      WHERE
	      p.method IN(1,2,9,14,15) 
      AND 
        t.location_id = ${location_id} 
      AND 
        p.amount !=0
	    AND t.transaction_date <= '${deposit_date}'::date
      AND t.transaction_date > '2023-01-09'
      AND p.match = false::boolean
	    GROUP BY t.fiscal_date 
	    ORDER BY t.fiscal_date DESC
  `);
  }

  async queryPosPayments(
    location_id: number,
    date: string
  ): Promise<PaymentEntity[]> {
    try {
      return await this.paymentRepo.find({
        select: {
          transaction: { id: true, location_id: true, transaction_date: true },
          amount: true,
          method: true,
          match: true
        },
        where: {
          match: Boolean(false),
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
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOne({
      where: { id: payment.id }
    });
    return await this.paymentRepo.save({
      ...paymentEntity,
      match: Boolean(true),
      pos_deposit_id: deposit.id
    });
  }

  async markCashPaymentAsMatched(
    payment: any,
    deposit: any
  ): Promise<PaymentEntity[]> {
    const { ids } = payment;
    return ids.split(',').map(async (id: string) => {
      const paymentEntity = await this.paymentRepo.findOneByOrFail({ id });
      paymentEntity.match = Boolean(true);
      paymentEntity.cash_deposit_id = deposit.id;
      return await this.paymentRepo.save(paymentEntity);
    });
  }
}
