import { Column, DataType } from '../../common/fixedWidthRecord/fixedWidthRecord.decorator';
import { FixedWidthRecord, IFixedWidthRecord } from '../../common/fixedWidthRecord/fixedWidthRecord';

export interface ITDI17Details extends IFixedWidthRecord<ITDI17Details> {
  rcd_type: number;
  ministry_no: string;
  program_cd: number;
  deposit_date: number;
  transaction_type: number;
  office_number: number;
  deposit_time?: number;
  seq_no?: number;
  location_desc: string;
  deposit_amt_curr: number;
  currency?: string;
  exchange_adj_amt: number;
  deposit_amt_cdn: number;
  destination_bank_no: number;
  batch_no: number;
  jv_type?: string;
  jv_no?: number;
}

export class TDI17Details extends FixedWidthRecord<ITDI17Details> implements ITDI17Details {
  public static readonly resourceType = 'TDIDetails';

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

  @Column({ start: 1, width: 2 })
  public get ministry_no() {
    return this.resource.ministry_no;
  }

  public set ministry_no(data) {
    this.resource.ministry_no = data;
  }

  @Column({ start: 3, width: 4, format: { type: DataType.Integer } })
  public get program_cd() {
    return this.resource.program_cd;
  }

  public set program_cd(data) {
    this.resource.program_cd = data;
  }

  @Column({ start: 7, width: 8 })
  public get deposit_date() {
    return this.resource.deposit_date;
  }

  public set deposit_date(data) {
    this.resource.deposit_date = data;
  }

  @Column({ start: 15, width: 3, format: { type: DataType.Integer } })
  public get transaction_type() {
    return this.resource.transaction_type;
  }

  public set transaction_type(data) {
    this.resource.transaction_type = data;
  }

  @Column({ start: 18, width: 2, format: { type: DataType.Integer } })
  public get office_number() {
    return this.resource.office_number;
  }

  public set office_number(data) {
    this.resource.office_number = data;
  }

  @Column({ start: 20, width: 4, format: { type: DataType.Integer } })
  public get deposit_time() {
    return this.resource.deposit_time;
  }

  public set deposit_time(data) {
    this.resource.deposit_time = data;
  }

  @Column({
    start: 24,
    width: 3,
    format: { type: DataType.Integer },
  })
  public get seq_no() {
    return this.resource.seq_no;
  }

  public set seq_no(data) {
    this.resource.seq_no = data;
  }

  @Column({ start: 27, width: 40 })
  public get location_desc() {
    return this.resource.location_desc;
  }

  public set location_desc(data) {
    this.resource.location_desc = data;
  }

  @Column({ start: 67, width: 12, format: { type: DataType.Integer } })
  public get deposit_amt_curr() {
    return this.resource.deposit_amt_curr;
  }

  public set deposit_amt_curr(data) {
    this.resource.deposit_amt_curr = data;
  }

  @Column({ start: 80, width: 2 })
  public get currency() {
    return this.resource.currency;
  }

  public set currency(data) {
    this.resource.currency = data;
  }

  @Column({
    start: 82,
    width: 12,
    format: { type: DataType.Integer },
  })
  public get exchange_adj_amt(): number {
    return this.resource.exchange_adj_amt;
  }

  public set exchange_adj_amt(data) {
    this.resource.exchange_adj_amt = data;
  }

  @Column({ start: 95, width: 12, format: { type: DataType.Integer } })
  public get deposit_amt_cdn(): number {
    return this.resource.deposit_amt_cdn;
  }

  public set deposit_amt_cdn(data) {
    this.resource.deposit_amt_cdn = data;
  }

  @Column({ start: 108, width: 4, format: { type: DataType.Integer } })
  public get destination_bank_no(): number {
    return this.resource.destination_bank_no;
  }

  public set destination_bank_no(data) {
    this.resource.destination_bank_no = data;
  }

  @Column({ start: 112, width: 9, format: { type: DataType.Integer } })
  public get batch_no(): number {
    return this.resource.batch_no;
  }

  public set batch_no(data) {
    this.resource.batch_no = data;
  }

  @Column({ start: 121, width: 1 })
  public get jv_type() {
    return this.resource.jv_type;
  }

  public set jv_type(data) {
    this.resource.jv_type = data;
  }

  @Column({ start: 122, width: 9, format: { type: DataType.Integer } })
  public get jv_no() {
    return this.resource.jv_no;
  }

  public set jv_no(data) {
    this.resource.jv_no = data;
  }
}
