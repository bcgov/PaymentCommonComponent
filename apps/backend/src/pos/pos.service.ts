import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { LocationService } from './../location/location.service';
import { PaymentEntity } from './../sales/entities/payment.entity';

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

  async queryPOSDeposits(
    location_id: number,
    date: string
  ): Promise<POSDepositEntity[]> {
    const merchant_ids = await this.locationService.getMerchantIdsByLocationId(
      location_id
    );
    return (
      merchant_ids &&
      (await this.posDepositRepo.find({
        select: {
          transaction_date: true,
          merchant_id: true,
          transaction_amt: true,
          id: true,
          match: true,
          metadata: { program: true }
        },
        where: {
          match: Boolean(false),
          metadata: { program: 'SBC' },
          transaction_date: date,
          merchant_id: In(merchant_ids)
        }
      }))
    );
  }

  async markPOSDepositAsMatched(
    payment: PaymentEntity,
    deposit: POSDepositEntity
  ): Promise<POSDepositEntity> {
    const pos_deposit = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });

    pos_deposit.match = Boolean(true);
    pos_deposit.matched_payment_id = payment.id;

    return await this.posDepositRepo.save(pos_deposit);
  }
}
