import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { LocationService } from '../location/location.service';
import { EventTypeEnum } from '../reconciliation/const';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { ReconciliationEvent } from '../reconciliation/const';

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

  async queryCashPayments(
    event: ReconciliationEvent
  ): Promise<PaymentEntity[]> {
    // TODO  CONVERT TO USE QUERY BUILDER
    return await this.transactionRepo.manager.query(`
      SELECT
	      t.fiscal_date,    
	      SUM(p.amount) as amount,
	      STRING_AGG(p.id::varchar, ','::varchar) as id
      FROM
	      transaction t
      JOIN 
        payment p 
      ON
	      p.transaction = t.id
      WHERE
	      p.method IN(1,2,3,9,14,15) 
      AND 
        t.location_id = ${event.location_id} 
      AND 
        p.amount !=0
	    AND 
        t.transaction_date <= '${event.date}'::date
      AND 
        t.transaction_date > '2023-01-09'
      AND 
        p.match = false::boolean
	    GROUP BY 
        t.fiscal_date 
	    ORDER BY 
        t.fiscal_date DESC
  `);
  }

  async queryPosPayments(event: ReconciliationEvent): Promise<PaymentEntity[]> {
    const payments = await this.paymentRepo.manager.query(`
    SELECT
	    p.amount,
	    p.method,
	    p.id,
	    t.transaction_date,
	    t.location_id
    FROM
	    payment p
    JOIN 
      transaction t 
    ON
	    p.transaction=t.id
    JOIN 
      payment_method pm 
    ON 
      pm.sbc_code=p.method
    WHERE 
      t.transaction_date='${event.date}'::date
    AND 
      t.location_id=${event.location_id}
    AND 
      p.amount !=0
    AND
      p.match=false::boolean
    AND 
      p.method in (11, 12,13,15,17)
    `);
    return payments;
  }

  async reconcile(
    payment: PaymentEntity,
    deposit: CashDepositEntity | POSDepositEntity
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });
    paymentEntity.match = true;
    paymentEntity.deposit_id = deposit.id;
    const updated = await this.paymentRepo.save(paymentEntity);
    return updated;
  }

  async queryTransactions(
    event: ReconciliationEvent
  ): Promise<PaymentEntity[]> {
    if (event.type === EventTypeEnum.POS) {
      const payments = await this.queryPosPayments(event);
      return payments;
    } else {
      return await this.queryCashPayments(event);
    }
  }
}
