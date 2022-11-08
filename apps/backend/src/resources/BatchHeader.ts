import {
  Column,
  DataType,
} from '../resources/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord,
} from '../resources/fixedWidthRecord/fixedWidthRecord';

export interface IBatchHeader extends IFixedWidthRecord<IBatchHeader> {
  feederNumber1?: number;
  batchType?: string;
  transactionType?: string;
  feederNumber2?: number;
  fiscalYear?: number;
  batchNumber?: string;
  messageVersion?: number;
}

export class BatchHeader extends FixedWidthRecord<IBatchHeader> implements IBatchHeader {
  public static readonly resourceType = 'BatchHeader';
  public static readonly delimiter = {
    value: '',
    positions: [8, 30],
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

  @Column({ start: 9, width: 4, format: { type: DataType.Integer } })
  public get feederNumber2() {
    return this.resource.feederNumber2;
  }

  @Column({ start: 13, width: 4 })
  public get fiscalYear() {
    return this.resource.fiscalYear;
  }

  @Column({ start: 17, width: 9 })
  public get batchNumber() {
    return this.resource.batchNumber;
  }

  @Column({ start: 26, width: 4 })
  public get messageVersion() {
    return this.resource.messageVersion;
  }
}
