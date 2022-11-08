import {
  Column,
  DataType,
} from '../resources/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord,
} from '../resources/fixedWidthRecord/fixedWidthRecord';
import { SalesDTO } from '../sales/dto/sales.dto';
import { transformSalesEventOptions } from './Resource';


export interface IJVHeader extends IFixedWidthRecord<IJVHeader> {
  feederNumber1?: number;
  batchType?: string;
  transactionType?: string;
  journalName?: string;
  journalBatchName?: string;
  controlTotal?: number;
  recordType?: string;
  countryCurrencyCode?: string;
  externalReferenceSource?: string;
  FlowThru?: string;
}
export class JVHeader extends FixedWidthRecord<IJVHeader> implements IJVHeader {
  public static readonly resourceType = 'JVHeader';
  public static readonly delimiter = {
    value: '',
    positions: [8, 273],
    length: 1,
  };

  public static transformSalesEvent(record: SalesDTO, options: transformSalesEventOptions) {
    return new JVHeader({
      feederNumber1: 123,
      batchType: 'GP',
      transactionType: 'JH',
      journalName: `SM J${options.index.toString().padStart(6, '0')}`,
      journalBatchName: 'SM GA REVENUE',
      controlTotal: record.total_amount,
      recordType: 'A',
      countryCurrencyCode: 'CAD',
      externalReferenceSource: '',
      FlowThru: '2023000001967',
    });
  }

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

  @Column({ start: 9, width: 10 })
  public get journalName() {
    return this.resource.journalName;
  }

  @Column({ start: 19, width: 25 })
  public get journalBatchName() {
    return this.resource.journalBatchName;
  }

  @Column({ start: 44, width: 15 })
  public get controlTotal() {
    return this.resource.controlTotal;
  }

  @Column({ start: 59, width: 1 })
  public get recordType() {
    return this.resource.recordType;
  }

  @Column({ start: 60, width: 3 })
  public get countryCurrencyCode() {
    return this.resource.countryCurrencyCode;
  }

  @Column({ start: 63, width: 100 })
  public get externalReferenceSource() {
    return this.resource.externalReferenceSource;
  }

  @Column({ start: 163, width: 110 })
  public get FlowThru() {
    return this.resource.FlowThru;
  }
}
