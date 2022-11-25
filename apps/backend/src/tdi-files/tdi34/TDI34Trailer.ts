import {
  Column,
  DataType,
} from '../../common/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord,
} from '../../common/fixedWidthRecord/fixedWidthRecord';

export interface ITDI34Trailer extends IFixedWidthRecord<ITDI34Trailer> {
  rcd_type: number;
  no_of_detail_rcd: string;
  transaction_amt: string;
  filler: string;
}

export class TDI34Trailer
  extends FixedWidthRecord<ITDI34Trailer>
  implements ITDI34Trailer
{
  public static readonly resourceType = 'TDI34Trailer';

  constructor(init?: any) {
    super(init);
  }
  
  @Column({ start: 0, width: 1, format: { type: DataType.Integer } })
  public get rcd_type(): number {
    return this.resource.rcd_type;
  }

  public set rcd_type(data) {
    this.resource.rcd_type = data;
  }

  @Column({ start: 1, width: 6 })
  public get no_of_detail_rcd() {
    return this.resource.no_of_detail_rcd;
  }

  public set no_of_detail_rcd(data) {
    this.resource.no_of_detail_rcd = data;
  }

  @Column({ start: 7, width: 13 })
  public get transaction_amt() {
    return this.resource.transaction_amt;
  }

  public set transaction_amt(data) {
    this.resource.transaction_amt = data;
  }

  @Column({ start: 20, width: 151 })
  public get filler() {
    return this.resource.filler;
  }
  
  public set filler(data) {
    this.resource.filler = data;
  }
}
