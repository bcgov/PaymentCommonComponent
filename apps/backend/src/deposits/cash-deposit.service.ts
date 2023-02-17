import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { CashDepositEntity } from './entities/cash-deposit.entity';
import { AppLogger } from '../logger/logger.service';
import { ReconciliationEvent, CashDepositDates } from '../reconciliation/types';

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

  async getDepositDateRange(
    event: ReconciliationEvent
  ): Promise<CashDepositDates> {
    /*eslint-disable */
    const dates = await this.cashDepositRepo.find({
      select: { deposit_date: true },
      where: {
        location_id: event.location_id,
        deposit_date: Raw(
          (alias: any) =>
            `${alias} <= '${event.date}'::date and ${alias} > '${event.fiscal_start_date}'::date`
        )
      },
      order: {
        deposit_date: 'DESC'
      }
    });

    const depositDates = Array.from(
      new Set(dates.map((itm: Partial<CashDepositEntity>) => itm.deposit_date))
    );
    return {
      current: depositDates[0],
      pastDue: depositDates[2],
      first: depositDates[depositDates.length - 1]
    };
  }

  async findCashDepositsByDepositDates(
    event: ReconciliationEvent,
    cashDepositDates: CashDepositDates
  ): Promise<CashDepositEntity[]> {
    const { program, location_id } = event;

    return await this.cashDepositRepo.find({
      where: {
        location_id,
        deposit_date: Raw(
          (alias) =>
            `${alias} <= '${cashDepositDates.current}'::date and ${alias} > '${cashDepositDates.first}'::date`
        ),
        metadata: {
          program
        }
      },
      order: {
        deposit_date: 'DESC'
      }
    });
  }

  async updateDepositStatus(
    deposit: CashDepositEntity
  ): Promise<CashDepositEntity> {
    const depositEntity = await this.cashDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    return await this.cashDepositRepo.save({ ...depositEntity, ...deposit });
  }
}
