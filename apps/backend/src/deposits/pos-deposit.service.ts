import { ReconciliationEvent } from './../../dist/reconciliation/const.d';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { LocationService } from '../location/location.service';
import { PosDepositQueryService } from './pos-deposit.repository';
@Injectable()
export class PosDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(LocationService)
    private locationService: LocationService,
    @Inject(PosDepositQueryService)
    private posQueryService: PosDepositQueryService,
    @InjectRepository(POSDepositEntity)
    private posDepositRepo: Repository<POSDepositEntity>
  ) {}

  findAll(): Promise<POSDepositEntity[]> {
    return this.findAll();
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

  async findAllByLocationAndDate(event: ReconciliationEvent) {
    return await this.posQueryService.queryPOS(
      event,
      await this.posQueryService.getMerchantIdsByLocationId(event)
    );
  }

  async createPOSDepositEntity(
    data: POSDepositEntity
  ): Promise<POSDepositEntity> {
    return await this.posDepositRepo.save(this.posDepositRepo.create(data));
  }

  async updatePOSDepositEntity(
    deposit: Partial<POSDepositEntity>,
    payment: Partial<PaymentEntity>
  ): Promise<POSDepositEntity> {
    const depositEntity = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    depositEntity.match = true;
    depositEntity.matched_payment_id = `${payment.id}`;

    const updated = await this.posDepositRepo.save(depositEntity);

    return updated;
  }
}
