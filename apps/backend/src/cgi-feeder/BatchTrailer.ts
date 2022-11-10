import {
  Column,
  DataType,
} from './fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord,
} from './fixedWidthRecord/fixedWidthRecord';
import { FEEDER_NUMBER } from './constants';

export interface IBatchTrailer extends IFixedWidthRecord<IBatchTrailer> {
  feederNumber1?: number;
  batchType?: string;
  transactionType?: string;
  clientSystem?: number;
  fiscalYear?: number;
  batchNumber?: string;
  controlCount?: number;
  controlTotal?: number;
}

export const BATCH_TRAILER_TX_TYPE = 'BT';
export const BATCH_TRAILER_BATCH_TYPE = 'GI';
export const BATCH_TRAILER_MESSAGE_VERSION = 4010;

export class BatchTrailer
  extends FixedWidthRecord<IBatchTrailer>
  implements IBatchTrailer
{
  public static readonly resourceType = 'BatchTrailer';
  public static readonly delimiter = {
    value: '',
    positions: [8, 56],
    length: 1,
  };
  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  public get feederNumber1() {
    return this.resource.feederNumber1;
  }

  @Column({ start: 4, width: 2 })
  public get batchType() {
    return this.resource.batchType;
  }

  @Column({ start: 6, width: 2 })
  public get transactionType() {
    return this.resource.transactionType;
  }

  @Column({ start: 9, width: 4 })
  public get clientSystem() {
    return this.resource.clientSystem;
  }

  @Column({ start: 13, width: 4 })
  public get fiscalYear() {
    return this.resource.fiscalYear;
  }

  @Column({ start: 17, width: 9 })
  public get batchNumber() {
    return this.resource.batchNumber;
  }

  @Column({ start: 26, width: 15 })
  public get controlCount() {
    return this.resource.controlCount;
  }

  @Column({ start: 41, width: 15 })
  public get controlTotal() {
    return this.resource.controlTotal;
  }

  public static generate(count: number, total: number) {
    return new BatchTrailer({
      feederNumber1: FEEDER_NUMBER,
      batchType: BATCH_TRAILER_BATCH_TYPE,
      transactionType: BATCH_TRAILER_TX_TYPE,
      clientSystem: FEEDER_NUMBER,
      fiscalYear: 2023,
      batchNumber: '',
      controlCount: count,
      controlTotal: total,
    });
  }
}
