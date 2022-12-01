import {
  Column,
  DataType
} from '../../common/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../../common/fixedWidthRecord/fixedWidthRecord';

export interface ITDI34Header extends IFixedWidthRecord<ITDI34Header> {
  rcd_type: string;
  settlement_date: string;
  filler: string;
}

export class TDI34Header
  extends FixedWidthRecord<ITDI34Header>
  implements ITDI34Header
{
  public static readonly resourceType = 'TDI34Header';

  constructor(init?: any) {
    super(init);
  }

  @Column({ start: 0, width: 1, format: { type: DataType.Integer } })
  public get rcd_type() {
    return this.resource.rcd_type;
  }

  public set rcd_type(data) {
    this.resource.rcd_type = data;
  }

  @Column({ start: 1, width: 8 })
  public get settlement_date() {
    return this.resource.settlement_date;
  }

  public set settlement_date(data) {
    this.resource.settlement_date = data;
  }

  @Column({ start: 9, width: 162 })
  public get filler() {
    return this.resource.filler;
  }

  public set filler(data) {
    this.resource.filler = data;
  }
}
