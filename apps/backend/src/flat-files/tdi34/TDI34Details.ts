import {
  Column,
  DataType
} from '../../common/decorators/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../../common/entities/FixedWidthRecord';

export interface ITDI34Details extends IFixedWidthRecord<ITDI34Details> {
  metadata: unknown;
  rcd_type: number;
  merchant_id: string;
  terminal_no: string;
  fill1: string;
  card_vendor: string;
  card_id: string;
  transaction_date: string;
  transaction_time: string;
  settlement_date: string;
  transaction_code: string;
  fill2: string;
  approval_code: string;
  fill3: string;
  transaction_amt: number;
  invoice_no: string;
  echo_data_field: string;
  fill4: string;
}

export class TDI34Details
  extends FixedWidthRecord<ITDI34Details>
  implements ITDI34Details
{
  public static readonly resourceType = 'TDI34Details';
  /*eslint-disable */
  constructor(init?: any) {
    super(init);
  }

  public get metadata() {
    return this.resource.metadata;
  }

  public set metadata(data) {
    this.resource.metadata = data;
  }

  @Column({ start: 0, width: 1, format: { type: DataType.Integer } })
  public get rcd_type(): number {
    return this.resource.rcd_type;
  }

  public set rcd_type(data) {
    this.resource.rcd_type = data;
  }

  @Column({ start: 1, width: 8, format: { type: DataType.Integer } })
  public get merchant_id() {
    return this.resource.merchant_id;
  }

  public set merchant_id(data) {
    this.resource.merchant_id = data;
  }

  @Column({ start: 9, width: 12 })
  public get terminal_no() {
    return this.resource.terminal_no;
  }

  public set terminal_no(data) {
    this.resource.terminal_no = data;
  }

  @Column({ start: 21, width: 5 })
  public get fill1() {
    return this.resource.fill1;
  }

  public set fill1(data) {
    this.resource.fill1 = data;
  }

  @Column({ start: 26, width: 2 })
  public get card_vendor() {
    return this.resource.card_vendor;
  }

  public set card_vendor(data) {
    this.resource.card_vendor = data;
  }

  @Column({ start: 28, width: 19 })
  public get card_id() {
    return this.resource.card_id;
  }

  public set card_id(data) {
    this.resource.card_id = data;
  }

  @Column({ start: 47, width: 8, format: { type: DataType.Date } })
  public get transaction_date() {
    return this.resource.transaction_date;
  }

  public set transaction_date(data) {
    this.resource.transaction_date = data;
  }

  @Column({ start: 55, width: 4, format: { type: DataType.Time } })
  public get transaction_time() {
    return this.resource.transaction_time;
  }

  public set transaction_time(data) {
    this.resource.transaction_time = data;
  }

  @Column({
    start: 59,
    width: 8,
    format: { type: DataType.Date }
  })
  public get settlement_date() {
    return this.resource.settlement_date;
  }

  public set settlement_date(data) {
    this.resource.settlement_date = data;
  }

  @Column({ start: 67, width: 2 })
  public get transaction_code() {
    return this.resource.transaction_code;
  }

  public set transaction_code(data) {
    this.resource.transaction_code = data;
  }

  @Column({ start: 69, width: 3 })
  public get fill2() {
    return this.resource.fill2;
  }

  public set fill2(data) {
    this.resource.fill2 = data;
  }

  @Column({ start: 72, width: 6 })
  public get approval_code() {
    return this.resource.approval_code;
  }

  public set approval_code(data) {
    this.resource.approval_code = data;
  }

  @Column({
    start: 78,
    width: 2
  })
  public get fill3() {
    return this.resource.fill3;
  }

  public set fill3(data) {
    this.resource.fill3 = data;
  }

  @Column({ start: 80, width: 9, format: { type: DataType.Decimal } })
  public get transaction_amt(): number {
    return this.resource.transaction_amt;
  }

  public set transaction_amt(data) {
    this.resource.transaction_amt = data;
  }

  @Column({ start: 89, width: 10 })
  public get invoice_no() {
    return this.resource.invoice_no;
  }

  public set invoice_no(data) {
    this.resource.invoice_no = data;
  }

  @Column({ start: 99, width: 36 })
  public get echo_data_field() {
    return this.resource.echo_data_field;
  }

  public set echo_data_field(data) {
    this.resource.echo_data_field = data;
  }

  @Column({ start: 135, width: 16 })
  public get fill4() {
    return this.resource.fill4;
  }

  public set fill4(data) {
    this.resource.fill4 = data;
  }
}
