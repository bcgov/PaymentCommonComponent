import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async queryCashDepositRange(location_id: number) {
    const cash_deposits_date = await this.cashDepositRepo.manager.query(
      `SELECT DISTINCT deposit_date::varchar FROM cash_deposit cd WHERE cd.location_id=${location_id} ORDER BY deposit_date DESC`
    );

    const current_deposit_date = cash_deposits_date[0]?.deposit_date
      .toString()
      .split('T')[0];

    const last_deposit_date = cash_deposits_date[1]?.deposit_date
      .toString()
      .split('T')[0];

    return { last_deposit_date, current_deposit_date };
  }

  async queryCashDeposit(
    location_id: number,
    current_deposit_date: string,
    date: string
  ): Promise<CashDepositEntity[]> {
    // TODO
    // const qb = this.cashDepositRepo.createQueryBuilder('cash_deposit');
    // qb.select('distinct(cd.deposit_date), cd.location_id, cd.deposit_amt_cdn')
    //   .where('cash_deposit.location_id = :location_id', { location_id })
    //   .andWhere('cd.deposit_date  = :deposit_date', { current_deposit_date })
    //   .groupBy('cd.deposit_date, cd.location_id, cd.deposit_amt_cdn')
    //   .orderBy('cd.deposit_date desc, cd.location_id asc');

    const cash_deposits = await this.cashDepositRepo.manager.query(`
        SELECT distinct(cd.deposit_date), cd.location_id, cd.deposit_amt_cdn
        FROM cash_deposit cd
        WHERE cd.location_id=${location_id}
        and cd.deposit_date  = '${current_deposit_date ?? date} '
        GROUP BY  cd.deposit_date, cd.location_id, cd.deposit_amt_cdn
        ORDER BY cd.deposit_date desc, cd.location_id asc
    `);

    return cash_deposits;
  }
}
