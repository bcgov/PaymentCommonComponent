import {
  Column,
  DataType
} from '../common/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../common/fixedWidthRecord/fixedWidthRecord';
import { FEEDER_NUMBER } from './constants';

export interface IBatchHeader extends IFixedWidthRecord<IBatchHeader> {
  feederNumber1?: number;
  batchType?: string;
  transactionType?: string;
  feederNumber2?: number;
  fiscalYear?: number;
  batchNumber?: string;
  messageVersion?: number;
}

export const BATCH_HEADER_TX_TYPE = 'BH';
export const BATCH_HEADER_BATCH_TYPE = 'GI';
export const BATCH_HEADER_MESSAGE_VERSION = 4010;

export class BatchHeader
  extends FixedWidthRecord<IBatchHeader>
  implements IBatchHeader
{
  public static readonly resourceType = 'BatchHeader';
  public static readonly delimiter = {
    value: '',
    positions: [8, 30],
    length: 1
  };

  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  public get feederNumber1() {
    return this.resource.feederNumber1;
  }

  public set feederNumber1(data) {
    this.resource.feederNumber1 = data;
  }

  @Column({ start: 4, width: 2 })
  public get batchType() {
    return this.resource.batchType;
  }

  public set batchType(data) {
    this.resource.batchType = data;
  }

  @Column({ start: 6, width: 2 })
  public get transactionType() {
    return this.resource.transactionType;
  }

  public set transactionType(data) {
    this.resource.transactionType = data;
  }

  @Column({ start: 9, width: 4, format: { type: DataType.Integer } })
  public get feederNumber2() {
    return this.resource.feederNumber2;
  }

  public set feederNumber2(data) {
    this.resource.feederNumber2 = data;
  }

  @Column({ start: 13, width: 4 })
  public get fiscalYear() {
    return this.resource.fiscalYear;
  }

  public set fiscalYear(data) {
    this.resource.fiscalYear = data;
  }

  @Column({ start: 17, width: 9 })
  public get batchNumber() {
    return this.resource.batchNumber;
  }

  public set batchNumber(data) {
    this.resource.batchNumber = data;
  }

  @Column({ start: 26, width: 4 })
  public get messageVersion() {
    return this.resource.messageVersion;
  }

  public set messageVersion(data) {
    this.resource.messageVersion = data;
  }

  public static generate() {
    return new BatchHeader({
      feederNumber1: FEEDER_NUMBER,
      batchType: BATCH_HEADER_BATCH_TYPE,
      transactionType: BATCH_HEADER_TX_TYPE,
      feederNumber2: FEEDER_NUMBER,
      fiscalYear: 2023, //TODO Track fiscal year
      batchNumber: '',
      messageVersion: BATCH_HEADER_MESSAGE_VERSION
    });
  }
}
