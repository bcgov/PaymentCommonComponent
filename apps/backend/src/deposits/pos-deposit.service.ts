import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from '../sales/entities/payment.entity';
import { ReconciliationEvent } from '../reconciliation/const';
import { LocationService } from '../location/location.service';

export class PosDepositService {
  constructor(
    @Inject(Logger) private readonly appLogger: AppLogger,
    @Inject(LocationService)
    private locationService: LocationService,
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

  async createPOSDeposit(data: POSDepositEntity): Promise<POSDepositEntity> {
    return await this.posDepositRepo.save(this.posDepositRepo.create(data));
  }

  async query(event: ReconciliationEvent): Promise<POSDepositEntity[]> {
    const merchant_ids = await this.locationService.getMerchantIdsByLocationId(
      event.location_id
    );
    return (
      merchant_ids &&
      (await this.posDepositRepo.manager.query(`
      SELECT
        transaction_date,
        merchant_id,
        transaction_amt,
        id,
        program,
        match, 
        matched_payment_id
      FROM
        pos_deposit
      WHERE
        transaction_date = '${event.date}'::date
      AND 
        merchant_id in (${merchant_ids})
      AND
        match='false'::boolean
      AND 
        program='${event.program}'
      `))
    );
  }

  async reconcile(
    payment: PaymentEntity,
    deposit: any
  ): Promise<POSDepositEntity> {
    const depositEntity = await this.posDepositRepo.findOneByOrFail({
      id: deposit.id
    });
    depositEntity.match = true;
    depositEntity.matched_payment_id = payment.id;

    const updated = await this.posDepositRepo.save(depositEntity);

    return updated;
  }
}
