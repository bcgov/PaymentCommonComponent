import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { AppLogger } from '../common/logger.service';
import { ReconciliationEvent } from '../reconciliation/const';
import { CashPaymentsCashDepositPair } from '../reconciliation/reconciliation.interfaces';

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

  async markCashDepositAsMatched(
    cashPaymentsCashDepositPair: CashPaymentsCashDepositPair
  ) {
    const cashDeposit = await this.cashDepositRepo.findOneByOrFail({
      id: cashPaymentsCashDepositPair.deposit.id
    });
    cashDeposit.match = true;
    // TODO: link cash deposit with all payments with proper db design
    // cashDeposit.cash_payment_ids = [all payment ids];
    await this.cashDepositRepo.save(cashDeposit);
  }

  // TODO - Assess if needed - Make typeorm
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

  // TODO - Assess if needed - Make typeorm
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

  async findAllPendingCashDeposits(
    event: ReconciliationEvent
  ): Promise<CashDepositEntity[]> {
    return await this.cashDepositRepo.find({
      relationLoadStrategy: 'query',
      where: {
        location_id: event?.location_id,
        metadata: {
          program: event?.program
        }
      }
    });
  }

  // TODO convert to use query builder and re-evaluate: where date is "greater than" in the query
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
      cd.deposit_date<='${deposit_dates.current}'
    AND 
      cd.deposit_date>'${deposit_dates.previous}'
    AND 
      cd.program='${event?.program}'
    AND 
      cd.match=false
    ORDER BY 
      deposit_date DESC
  `);
  }
}
