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
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { ReconciliationEvent } from '../reconciliation/const';

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

  async queryCashPayments(
    event: ReconciliationEvent,
    deposit_dates: { current: string; previous: string }
  ): Promise<PaymentEntity[]> {
    // TODO  CONVERT TO USE QUERY BUILDER

    return await this.transactionRepo.manager.query(`     
      SELECT
        t.fiscal_close_date::varchar,    
        SUM(p.amount) as amount,
        STRING_AGG(p.id::varchar, ','::varchar) as id
      FROM
        transaction t
      JOIN 
        payment p 
      ON
        p.transaction = t.id
      WHERE
        p.method 
      NOT 
      IN
        ('AX', 'V', 'P', 'M')
      AND 
        t.location_id = ${event?.location_id} 
      AND 
        p.amount !=0
      AND 
        t.fiscal_close_date <= '${deposit_dates?.current}'::date
      AND 
        t.fiscal_close_date > '${deposit_dates?.previous}'::date
      AND 
        p.match=false
      GROUP BY 
        t.fiscal_close_date 
      ORDER BY 
        t.fiscal_close_date 
      DESC
    `);
  }

  async queryPosPayments(event: ReconciliationEvent): Promise<PaymentEntity[]> {
    return await this.paymentRepo.manager.query(`
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
      WHERE 
        t.transaction_date='${event.date}'::date
      AND 
        t.location_id=${event.location_id}
      AND
        p.match=false
      AND p.method IN('AX', 'V', 'P', 'M')
      ORDER BY 
        t.transaction_date 
      DESC
    `);
  }

  async reconcilePOS(
    deposit: Partial<POSDepositEntity>,
    payment: Partial<PaymentEntity>
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });
    paymentEntity.match = true;
    paymentEntity.deposit_id = `${deposit.id}`;
    return await this.paymentRepo.save(paymentEntity);
  }

  async reconcileCash(
    deposit: Partial<CashDepositEntity>,
    payment: Partial<PaymentEntity>
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepo.findOneByOrFail({
      id: payment.id
    });
    paymentEntity.match = true;
    paymentEntity.deposit_id = deposit.id;
    return await this.paymentRepo.save(paymentEntity);
  }
}
