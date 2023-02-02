import { PaymentEntity } from '../sales/entities/payment.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { ReconciliationEvent } from '../reconciliation/const';

@Injectable()
export class CashDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(CashDepositEntity)
    private cashDepositRepo: Repository<CashDepositEntity>
  ) {}

  findAll(): Promise<CashDepositEntity[]> {
    return this.cashDepositRepo.find();
  }

  async findAllUploadedFiles(): Promise<
    { cash_deposit_source_file_name: string }[]
  > {
    return this.cashDepositRepo
      .createQueryBuilder('cash_deposit')
      .select('cash_deposit.metadata.source_file_name')
      .distinct()
      .getRawMany();
  }

  async createCashDeposit(data: CashDepositEntity): Promise<CashDepositEntity> {
    try {
      return await this.cashDepositRepo.save(this.cashDepositRepo.create(data));
    } catch (err) {
      this.appLogger.error(err);
      throw err;
    }
  }

  async queryLatestCashDeposit(
    location_id: number
  ): Promise<{ deposit_date: string }[]> {
    return await this.cashDepositRepo.manager.query(`
      SELECT DISTINCT(deposit_date::varchar) 
      FROM cash_deposit cd 
      WHERE cd.location_id=${location_id} 
      ORDER BY deposit_date DESC
      LIMIT 1
    `);
  }

  async getCashDates(event: ReconciliationEvent) {
    const cash_deposit_window = await this.cashDepositRepo.query(`
      SELECT 
        DISTINCT(deposit_date)::varchar
      FROM 
        cash_deposit 
      WHERE 
        location_id=${event?.location_id} 
      AND 
        deposit_date<='${event?.date}'::date 
      AND 
        deposit_date>= '2023-01-09'::date 
      AND 
        program='${event?.program}' 
      ORDER BY 
        deposit_date DESC 
      LIMIT 3
    `);

    return {
      current: cash_deposit_window[0]?.deposit_date ?? event?.date,
      previous: cash_deposit_window[1]?.deposit_date ?? '2023-01-09'
    };
  }

  //TODO convert to use query builder and re-evaluate: where date is "greater than" in the query
  async query(
    event: ReconciliationEvent,
    deposit_dates: { previous: string; current: string }
  ): Promise<CashDepositEntity[]> {
    return await this.cashDepositRepo.manager.query(`
    SELECT
      cd.deposit_date::varchar,
      cd.deposit_amt_cdn,
      cd.match,
      cd.location_id as garms_location_id,
      concat(cd.transaction_type::int, cd.location_id::int)::int as pt_location_id,
      cd.id
    FROM
      cash_deposit cd
    WHERE
      cd.location_id=${event?.location_id}
    AND 
      cd.deposit_date<='${deposit_dates.current}'::date
    AND 
      cd.deposit_date>'${deposit_dates.previous}'::date
    AND 
      cd.program='${event?.program}'
    AND 
      cd.match=false
    ORDER BY 
      deposit_date DESC
  `);
  }

  async reconcileCash(
    deposit: Partial<CashDepositEntity>,
    payment: Partial<PaymentEntity>
  ): Promise<CashDepositEntity> {
    const cashEntity = await this.cashDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    cashEntity.match = true;
    cashEntity.cash_payment_ids = payment.id;
    const updated = await this.cashDepositRepo.save(cashEntity);

    return updated;
  }
}
