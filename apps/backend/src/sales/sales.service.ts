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
    private paymentMethodRepo: Repository<PaymentMethodEntity>
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

  async queryCashTransactions(
    location_id: number,
    date_range: any
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

    const cash_transactions = await this.transactionRepo.manager.query(`
          SELECT distinct(t.fiscal_date), t.location_id,  SUM(p.amount) as amount
          FROM transaction t join payment p ON p.transaction = t.id
          WHERE p.method in(1,2,9,14,15)
          AND t.location_id=${location_id}
          AND t.fiscal_date < '${date_range.current_deposit_date}'
          and t.fiscal_date >= '${date_range.last_deposit_date}'
          and p.amount != '0'
          GROUP BY  t.fiscal_date, t.location_id
          ORDER BY fiscal_date DESC, location_id asc
    `);

    return cash_transactions;
  }

  async queryPOSTransactions(location_id: number, date: string) {
    const pos_transactions = await this.paymentRepo.find({
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
    return pos_transactions;
  }
}
