import { SalesDTO } from '../sales/dto/sales.dto';
import { BatchHeader } from './BatchHeader';
import { BatchTrailer } from './BatchTrailer';
import { JV } from './JV';
import { Resource, ResourceBase } from './Resource';

export interface IGLRecord extends ResourceBase<IGLRecord> {
  batchHeader: BatchHeader;
  jv: JV[];
  trailer: BatchTrailer;
}

export class GLRecord extends Resource<IGLRecord> implements IGLRecord {
  public static readonly resourceType = 'GLRecord';
  public get batchHeader(): BatchHeader {
    return new BatchHeader(this.resource.batchHeader);
  }

  public get jv() {
    return this.resource.jv.map((jv) => {
      return new JV(jv);
    });
  }

  public get trailer() {
    return new BatchTrailer(this.resource.trailer);
  }

  public static transformSalesEvent(
    records: SalesDTO[]
  ) {
    return new GLRecord({
      batchHeader: new BatchHeader({
        feederNumber1: 3085,
        batchType: 'GI',
        transactionType: 'BH',
        feederNumber2: 3085,
        fiscalYear: 2023,
        batchNumber: '000001967',
        messageVersion: 4010,
      }),
      trailer: new BatchTrailer({
        feederNumber1: 3085,
        batchType: 'GI',
        transactionType: 'BT',
        clientSystem: '3085',
        fiscalYear: 2023,
        batchNumber: '000001967',
        controlCount: records.length,
        controlTotal: records.reduce(
          (acc, record) => acc + record.total_amount,
          0,
        ),
      }),
      jv: records.map((record, idx) => JV.transformSalesEvent(record, {index: idx + 1})),
    });
  }
}
