import {
  Column,
  DataType
} from '../../common/decorators/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../../common/entities/FixedWidthRecord';
/*eslint-disable @typescript-eslint/no-explicit-any*/
export interface IDDFDetails extends IFixedWidthRecord<IDDFDetails> {
  metadata: any;
  rcd_type: number;
  merchant_no: string;
  terminal_id: string;
  filler1: string;
  card_vendor: string;
  card_id: string;
  transaction_date: Date;
  transaction_time: string;
  settlement_date: Date;
  transaction_code: string;
  filler2: string;
  approval_code: string;
  filler3: string;
  transaction_amount: string;
  unknown: string;
  worldline_transaction_id: string;
  client_transaction_id: string;
  merchant_id: string;
  filler4: string;
  filler5: string;
}

export class DDFDetails
  extends FixedWidthRecord<IDDFDetails>
  implements IDDFDetails
{
  public static readonly resourceType = 'DDFDetails';

  constructor(init?: any) {
    super(init);
  }

  public get metadata() {
    return this.resource.metadata;
  }

  public set metadata(data) {
    this.resource.metadata = data;
  }

  @Column({
    start: 0,
    width: 1,
    format: { type: DataType.Integer },
    example: 2
  })
  public get rcd_type() {
    return this.resource.rcd_type;
  }

  public set rcd_type(data) {
    this.resource.rcd_type = data;
  }

  @Column({
    start: 1,
    width: 8
  })
  public get merchant_no() {
    return this.resource.merchant_no;
  }

  public set merchant_no(data) {
    this.resource.merchant_no = data;
  }

  @Column({ start: 9, width: 12, example: 'Y22046144001' })
  public get terminal_id() {
    return this.resource.terminal_id;
  }

  public set terminal_id(data) {
    this.resource.terminal_id = data;
  }

  @Column({ start: 21, width: 5, example: '' })
  public get filler1() {
    return this.resource.filler1;
  }

  public set filler1(data) {
    this.resource.filler1 = data;
  }

  @Column({
    start: 26,
    width: 2,
    example: 'V ',
    format: { type: DataType.Card }
  })
  public get card_vendor() {
    return this.resource.card_vendor;
  }

  public set card_vendor(data) {
    this.resource.card_vendor = data;
  }

  @Column({ start: 28, width: 19, example: 'XXXXXXXXXXXXXXX1111' })
  public get card_id() {
    return this.resource.card_id;
  }

  public set card_id(data) {
    this.resource.card_id = data;
  }

  @Column({
    start: 47,
    width: 8,
    example: '20220404',
    format: { type: DataType.Date }
  })
  public get transaction_date() {
    return this.resource.transaction_date;
  }

  public set transaction_date(data) {
    this.resource.transaction_date = data;
  }

  @Column({
    start: 55,
    width: 4,
    example: '1539',
    format: { type: DataType.Time }
  })
  public get transaction_time() {
    return this.resource.transaction_time;
  }

  public set transaction_time(data) {
    this.resource.transaction_time = data;
  }

  @Column({
    start: 59,
    width: 8,
    example: '20220405',
    format: { type: DataType.Date }
  })
  public get settlement_date() {
    return this.resource.settlement_date;
  }

  public set settlement_date(data) {
    this.resource.settlement_date = data;
  }

  @Column({
    start: 67,
    width: 2,
    example: '10',
    format: { type: DataType.TransactionCode }
  })
  public get transaction_code() {
    return this.resource.transaction_code;
  }

  public set transaction_code(data) {
    this.resource.transaction_code = data;
  }

  @Column({ start: 69, width: 3, example: '' })
  public get filler2() {
    return this.resource.filler2;
  }

  public set filler2(data) {
    this.resource.filler2 = data;
  }

  @Column({ start: 72, width: 6, example: '123456' })
  public get approval_code() {
    return this.resource.approval_code;
  }

  public set approval_code(data) {
    this.resource.approval_code = data;
  }

  @Column({ start: 78, width: 2, example: '' })
  public get filler3() {
    return this.resource.filler3;
  }

  public set filler3(data) {
    this.resource.filler3 = data;
  }

  public get transaction_amount() {
    return this.resource.transaction_amount;
  }
  @Column({
    start: 80,
    width: 9
  })
  public set transaction_amount(data) {
    this.resource.transaction_amount = data;
  }

  @Column({ start: 89, width: 10, example: '' })
  public get unknown() {
    return this.resource.unknown;
  }

  public set unknown(data) {
    this.resource.unknown = data;
  }

  @Column({ start: 99, width: 8, example: '10032942' })
  public get worldline_transaction_id() {
    return this.resource.worldline_transaction_id;
  }

  public set worldline_transaction_id(data) {
    this.resource.worldline_transaction_id = data;
  }
  @Column({ start: 108, width: 10, example: '0007511333' })
  public get client_transaction_id() {
    return this.resource.client_transaction_id;
  }

  public set client_transaction_id(data) {
    this.resource.client_transaction_id = data;
  }
  @Column({ start: 118, width: 9, example: '117589202' })
  public get merchant_id() {
    return this.resource.merchant_id;
  }

  public set merchant_id(data) {
    this.resource.merchant_id = data;
  }
  @Column({ start: 127, width: 9, example: '' })
  public get filler4() {
    return this.resource.filler4;
  }

  public set filler4(data) {
    this.resource.filler4 = data;
  }
  @Column({ start: 127, width: 9, example: '' })
  public get filler5() {
    return this.resource.filler5;
  }

  public set filler5(data) {
    this.resource.filler5 = data;
  }
}
