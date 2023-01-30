import { LocationService } from './../location/location.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  TransactionEntity,
  PaymentMethodEntity,
  PaymentEntity
} from './entities';
import { AppLogger } from '../common/logger.service';

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

  // TODO: typed for garms sales txn
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
    date_range: { current_deposit_date: string; last_deposit_date: string },
    date: string
  ): Promise<TransactionEntity[]> {
    //TO DO
    // const qb = this.transactionRepo.createQueryBuilder('t');
    // qb.innerJoinAndSelect('t.payments', 'p');
    // qb.where('t.location_id = :location_id', { location_id })
    //   .andWhere('p.method in(1,2,9,14,15)')
    //   .andWhere('p.amount != 0')
    //   .andWhere('t.fiscal_date BETWEEN ${date_range}', { date_range })
    //   .groupBy('t.fiscal_date, t.location_id')
    //   .orderBy('fiscal_date DESC, location_id asc');
    const { current_deposit_date, last_deposit_date } = date_range;
    const cash_transactions =
      current_deposit_date && last_deposit_date
        ? await this.transactionRepo.manager.query(`
          SELECT distinct(t.fiscal_date), t.location_id,  SUM(p.amount) as amount
          FROM transaction t join payment p ON p.transaction = t.id
          WHERE p.method in(1,2,9,14,15)
          AND t.location_id=${location_id}
          AND t.fiscal_date < '${date_range.current_deposit_date}'
          and t.fiscal_date >= '${date_range.last_deposit_date}'
          and p.amount != '0'
          GROUP BY  t.fiscal_date, t.location_id
          ORDER BY fiscal_date DESC, location_id asc
    `)
        : await this.transactionRepo.manager.query(`
          SELECT distinct(t.fiscal_date), t.location_id,  SUM(p.amount) as amount
          FROM transaction t join payment p ON p.transaction = t.id
          WHERE p.method in(1,2,9,14,15)
          AND t.location_id=${location_id}
          AND t.fiscal_date < '${date}'
          and p.amount != '0'
          GROUP BY  t.fiscal_date, t.location_id
          ORDER BY fiscal_date DESC, location_id asc`);

    return cash_transactions;
  }

  async queryPOSTransactions(
    location_id: number,
    date: string
  ): Promise<PaymentEntity[]> {
    try {
      return await this.paymentRepo.find({
        select: {
          id: true,
          amount: true,
          method: true,
          currency: true,
          exchange_rate: true,
          transaction: {
            transaction_id: true,
            transaction_date: true,
            location_id: true
          }
        },
        where: {
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
}
