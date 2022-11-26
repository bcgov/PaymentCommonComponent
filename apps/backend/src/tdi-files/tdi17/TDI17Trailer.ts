import { Column, DataType } from '../../common/fixedWidthRecord/fixedWidthRecord.decorator';
import { FixedWidthRecord, IFixedWidthRecord } from '../../common/fixedWidthRecord/fixedWidthRecord';

export interface ITDI17Trailer extends IFixedWidthRecord<ITDI17Trailer> {
  rcd_type: string;
  no_of_details: string;
  deposit_amt_cdn: string;
  filler: string;
}

export class TDI17Trailer extends FixedWidthRecord<ITDI17Trailer> implements ITDI17Trailer {
  public static readonly resourceType = 'TDI17Trailer';

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

  @Column({ start: 1, width: 6 })
  public get no_of_details() {
    return this.resource.no_of_details;
  }

  public set no_of_details(data) {
    this.resource.no_of_details = data;
  }

  @Column({ start: 7, width: 14 })
  public get deposit_amt_cdn() {
    return this.resource.deposit_amt_cdn;
  }

  public set deposit_amt_cdn(data) {
    this.resource.deposit_amt_cdn = data;
  }

  @Column({ start: 21, width: 119 })
  public get filler() {
    return this.resource.filler;
  }

  public set filler(data) {
    this.resource.filler = data;
  }
}
