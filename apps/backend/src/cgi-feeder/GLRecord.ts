import { SalesDTO } from '../sales/dto/sales.dto';
import { BatchHeader } from './BatchHeader';
import { BatchTrailer } from './BatchTrailer';
import { JV } from './JV';
import { Resource, ResourceBase } from '../common/entities/Resource';

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

  public static transformSalesEvent(records: SalesDTO[]) {
    return new GLRecord({
      batchHeader: BatchHeader.generate(),
      trailer: BatchTrailer.generate(
        records.length,
        records.reduce((acc, record) => acc + record.total_amount, 0)
      ),
      jv: records.map((record) => JV.transformSalesEvent(record))
    });
  }
}
