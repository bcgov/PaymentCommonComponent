import { LocationService } from './../location/location.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';

@Injectable()
export class PosService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>,
    @Inject(LocationService)
    private locationService: LocationService
  ) {}

  findAll(): Promise<POSDepositEntity[]> {
    return this.posDepositRepo.find();
  }
  async findAllUploadedFiles(): Promise<
    { pos_deposit_source_file_name: string }[]
  > {
    return this.posDepositRepo
      .createQueryBuilder('pos_deposit')
      .select('pos_deposit.metadata.source_file_name')
      .distinct()
      .getRawMany();
  }

  async createPOSDeposit(data: POSDepositEntity): Promise<POSDepositEntity> {
    try {
      return await this.posDepositRepo.save(this.posDepositRepo.create(data));
    } catch (err) {
      this.appLogger.error(err, 'Error inserting TDI34 to POS Deposits table');
      throw err;
    }
  }

  async queryPOSDeposits(location_id: number, date: string) {
    const pos_deposits = await this.posDepositRepo.find({
      select: {
        id: true,
        card_vendor: true,
        transaction_date: true,
        transaction_amt: true,
        merchant_id: true
      },
      where: {
        transaction_date: date,
        merchant_id: In(
          await this.locationService.getMerchantIdsByLocationId(location_id)
        )
      }
    });
    return pos_deposits;
  }
}
