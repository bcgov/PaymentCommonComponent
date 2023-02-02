import { Injectable } from '@nestjs/common';
import { POSDepositEntity } from './entities/pos-deposit.entity';
import { ReconciliationEvent } from '../reconciliation/const';
import datasource from '../database/config';

@Injectable()
export class PosDepositQueryService {
  async getMerchantIdsByLocationId(event: ReconciliationEvent) {
    const merchantIds = await Promise.all(
      await datasource.query(
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
    return await datasource.query(`
    SELECT 
      pd.id, 
      pd.transaction_amt, 
      pd.match, 
      pd.card_vendor, 
      pd.transaction_date::varchar, 
      pd.transaction_time::varchar, 
      pm.sbc_code as method
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
}
