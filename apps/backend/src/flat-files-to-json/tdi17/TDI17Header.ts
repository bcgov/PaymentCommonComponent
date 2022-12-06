import {
  Column,
  DataType
} from '../../common/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../../common/fixedWidthRecord/fixedWidthRecord';

export interface ITDI17Header extends IFixedWidthRecord<ITDI17Header> {
  rcd_type: string;
  creation_date_str: string;
  creation_date: string;
  creation_time_str: string;
  creation_time: string;
  from_date_str: string;
  from_date: string;
  to_date_str: string;
  to_date: string;
  filler: string;
}
export class TDI17Header
  extends FixedWidthRecord<ITDI17Header>
  implements ITDI17Header
{
  public static readonly resourceType = 'TDI17Header';

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

  @Column({ start: 1, width: 15 })
  public get creation_date_str() {
    return this.resource.creation_date_str;
  }

  public set creation_date_str(data) {
    this.resource.creation_date_str = data;
  }

  @Column({ start: 16, width: 8 })
  public get creation_date() {
    return this.resource.creation_date;
  }

  public set creation_date(data) {
    this.resource.creation_date = data;
  }

  @Column({ start: 24, width: 17 })
  public get creation_time_str() {
    return this.resource.creation_time_str;
  }

  public set creation_time_str(data) {
    this.resource.creation_time_str = data;
  }

  @Column({ start: 41, width: 4 })
  public get creation_time() {
    return this.resource.creation_time;
  }

  public set creation_time(data) {
    this.resource.creation_time = data;
  }

  @Column({ start: 45, width: 24 })
  public get from_date_str() {
    return this.resource.from_date_str;
  }

  public set from_date_str(data) {
    this.resource.from_date_str = data;
  }

  @Column({ start: 69, width: 8 })
  public get from_date() {
    return this.resource.from_date;
  }

  public set from_date(data) {
    this.resource.from_date = data;
  }

  @Column({ start: 77, width: 12 })
  public get to_date_str() {
    return this.resource.to_date_str;
  }

  public set to_date_str(data) {
    this.resource.to_date_str = data;
  }

  @Column({ start: 89, width: 8 })
  public get to_date() {
    return this.resource.to_date;
  }

  public set to_date(data) {
    this.resource.to_date = data;
  }

  @Column({ start: 97, width: 43 })
  public get filler() {
    return this.resource.filler;
  }

  public set filler(data) {
    this.resource.filler = data;
  }
}
