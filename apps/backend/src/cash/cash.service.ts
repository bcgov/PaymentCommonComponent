import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { CashDepositEntity } from './entities/cash-deposit.entity';

@Injectable()
export class CashService {
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

  //TODO convert to use query builder and re-evaluate: where date is "greater than" in the query
  async queryCashDeposit(
    program: string,

    location_id: number,
    deposit_date: string
  ): Promise<CashDepositEntity[]> {
    return await this.cashDepositRepo.manager.query(`
      SELECT id, deposit_date, deposit_amt_cdn
      FROM cash_deposit cd
      WHERE location_id=${location_id}
      AND cd.deposit_date <= '${deposit_date}'
      AND cd.deposit_date >= '2023-01-12'
      AND cd.match = false
      AND cd.program = '${program}'
      ORDER BY deposit_date DESC`);
  }

  async markCashDepositAsMatched(
    payment: any,
    deposit: any
  ): Promise<UpdateResult> {
    return await this.cashDepositRepo.update(deposit.id, {
      match: true,
      cash_payment_ids: payment.ids
    });
  }
}
