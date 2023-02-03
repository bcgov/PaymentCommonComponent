import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/logger.service';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { PaymentEntity } from '../transaction/entities/payment.entity';
import { LocationService } from '../location/location.service';
import { ReconciliationEvent } from '../reconciliation/const';
@Injectable()
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
  async getMerchantIdsByLocationId(event: ReconciliationEvent) {
    const merchantIds = await Promise.all(
      await this.posDepositRepo.manager.query(
        `SELECT 
        "Merchant ID" as merchant_id 
      FROM 
        master_location_data 
      WHERE 
        "GARMS Location"=${event?.location_id} 
      AND "Type" 
        !='Bank'`
      )
    );
    return merchantIds?.map(({ merchant_id }: { merchant_id: string }) =>
      parseInt(merchant_id)
    );
  }

  async queryPOS(
    event: ReconciliationEvent,
    merchant_ids: number[]
  ): Promise<POSDepositEntity[]> {
    return await this.posDepositRepo.manager.query(`
    SELECT 
      pd.id, 
      pd.transaction_amt, 
      pd.match, 
      pd.card_vendor, 
      pd.transaction_date::varchar, 
      pd.transaction_time::varchar, 
      pm.method as method
    FROM 
      pos_deposit pd 
    JOIN 
      payment_method pm 
    ON 
      pm.method=pd.card_vendor 
    WHERE 
      transaction_date='${event?.date}'::date 
    AND 
      pd.program='${event?.program}'
    AND 
      pd.merchant_id IN (${merchant_ids}) 
    AND 
      pd.match=false 
    ORDER BY 
      pd.transaction_amt
    `);
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
    return await this.queryPOS(
      event,
      await this.getMerchantIdsByLocationId(event)
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

    return await this.posDepositRepo.save(depositEntity);
  }
}
