import {
  Column,
  DataType,
} from './fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord,
} from './fixedWidthRecord/fixedWidthRecord';
import { SalesDTO } from '../sales/dto/sales.dto';
import { FEEDER_NUMBER } from './constants';

export const JV_HEADER_TX_TYPE = 'JH';
export const JV_HEADER_BATCH_TYPE = 'GP';
export const JV_HEADER_BATCH_NAME_SUFFIX = 'GA REVENUE';
export const JV_HEADER_CURRENCY_CODE = 'CAD';
export const JV_HEADER_RECORD_TYPE = 'A';

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

  public static transformSalesEvent(record: SalesDTO) {
    return new JVHeader({
      feederNumber1: FEEDER_NUMBER,
      batchType: JV_HEADER_BATCH_TYPE,
      transactionType: JV_HEADER_TX_TYPE,
      journalName: record.journal_name,
      journalBatchName: `${record.ministry_alpha_identifier} ${JV_HEADER_BATCH_NAME_SUFFIX}`,
      controlTotal: record.total_amount,
      recordType: JV_HEADER_RECORD_TYPE,
      countryCurrencyCode: JV_HEADER_CURRENCY_CODE,
      externalReferenceSource: '',
      FlowThru: '',
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
