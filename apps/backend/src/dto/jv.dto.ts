import { Inject, Injectable } from '@nestjs/common';
import {
  Column,
  DataType,
} from 'src/common/fixedWidthRecord/fixedWidthRecord.decorator';
import { FixedWidthRecordService } from 'src/common/fixedWidthRecord/fixedWidthRecord.service';

@Injectable()
export class BatchHeader extends FixedWidthRecordService {
  constructor(init?: BatchHeader) {
    super({
      delimiter: {
        value: '',
        positions: [8, 30],
        length: 1,
      },
    });
    if (init) {
      this.feederNumber1 = init.feederNumber1;
      this.feederNumber2 = init.feederNumber2;
      this.batchNumber = init.batchNumber;
      this.fiscalYear = init.fiscalYear;
      this.messageVersion = init.messageVersion;
      this.batchType = init.batchType;
      this.transactionType = init.transactionType;
    }
  }
  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  feederNumber1: number;

  @Column({ start: 4, width: 2 })
  batchType: string;

  @Column({ start: 6, width: 2 })
  transactionType: string;

  @Column({ start: 9, width: 4, format: { type: DataType.Integer } })
  feederNumber2: string;

  @Column({ start: 13, width: 4 })
  fiscalYear: number;

  @Column({ start: 17, width: 9 })
  batchNumber: number;

  @Column({ start: 26, width: 4 })
  messageVersion: number;
}

@Injectable()
export class JVHeader extends FixedWidthRecordService {
  static line: number = 1;

  constructor(init?: JVHeader) {
    super({
      delimiter: {
        value: '',
        positions: [8, 273],
        length: 1,
      },
    });

    if (init) {
      this.feederNumber1 = init.feederNumber1;
      this.journalBatchName = init.journalBatchName;
      this.journalName = init.journalName;
      this.controlTotal = init.controlTotal;
      this.recordType = init.recordType;
      this.batchType = init.batchType;
      this.transactionType = init.transactionType;
      this.countryCurrencyCode = init.countryCurrencyCode;
      this.externalReferenceSource = init.externalReferenceSource;
      this.FlowThru = init.FlowThru;
    }
  }

  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  feederNumber1: number;

  @Column({ start: 4, width: 2 })
  batchType: string;

  @Column({ start: 6, width: 2 })
  transactionType: string;

  @Column({ start: 9, width: 10 })
  journalName: string;

  @Column({ start: 19, width: 25 })
  journalBatchName: number;

  @Column({ start: 44, width: 15 })
  controlTotal: number;

  @Column({ start: 59, width: 1 })
  recordType: number;

  @Column({ start: 60, width: 3 })
  countryCurrencyCode: string;

  @Column({ start: 63, width: 100 })
  externalReferenceSource: string;

  @Column({ start: 163, width: 110 })
  FlowThru: string;
}

@Injectable()
export class JVDetails extends FixedWidthRecordService {
  constructor(init?: JVDetails) {
    super({
      delimiter: {
        value: '',
        positions: [8, 317],
        length: 1,
      },
    });

    if (init) {
      this.feederNumber1 = init.feederNumber1;
      this.jvLineNumber = init.jvLineNumber;
      this.journalName = init.journalName;
      this.glEffectiveDate = init.glEffectiveDate;
      this.distributionAck = init.distributionAck;
      this.batchType = init.batchType;
      this.transactionType = init.transactionType;
      this.supplierNumber = init.supplierNumber;
      this.amountOfLine = init.amountOfLine;
      this.lineCode = init.lineCode;
      this.lineDescription = init.lineDescription;
      this.flowThru = init.flowThru;
    }
  }
  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  feederNumber1: number;

  @Column({ start: 4, width: 2 })
  batchType: string;

  @Column({ start: 6, width: 2 })
  transactionType: string;

  @Column({ start: 9, width: 10 })
  journalName: string;

  @Column({ start: 19, width: 5 })
  jvLineNumber: string;

  @Column({ start: 24, width: 8 })
  glEffectiveDate: string;

  @Column({ start: 32, width: 50 })
  distributionAck: string;

  @Column({ start: 82, width: 9 })
  supplierNumber: string;

  @Column({ start: 91, width: 15 })
  amountOfLine: string;

  @Column({ start: 106, width: 1 })
  lineCode: string;

  @Column({ start: 107, width: 100 })
  lineDescription: string;

  @Column({ start: 207, width: 110 })
  flowThru: string;
}

@Injectable()
export class JVTrailer extends FixedWidthRecordService {
  constructor(init?: JVTrailer) {
    super({
      delimiter: {
        value: '',
        positions: [8, 56],
        length: 1,
      },
    });
    if (init) {
      this.feederNumber1 = init.feederNumber1;
      this.clientSystem = init.clientSystem;
      this.fiscalYear = init.fiscalYear;
      this.batchNumber = init.batchNumber;
      this.controlCount = init.controlCount;
      this.batchType = init.batchType;
      this.transactionType = init.transactionType;
      this.controlTotal = init.controlTotal;
    }
  }
  @Column({ start: 0, width: 4, format: { type: DataType.Integer } })
  feederNumber1: number;

  @Column({ start: 4, width: 2 })
  batchType: string;

  @Column({ start: 6, width: 2 })
  transactionType: string;

  @Column({ start: 9, width: 4 })
  clientSystem: string;

  @Column({ start: 13, width: 4 })
  fiscalYear: number;

  @Column({ start: 17, width: 9 })
  batchNumber: number;

  @Column({ start: 26, width: 15 })
  controlCount: number;

  @Column({ start: 41, width: 15 })
  controlTotal: number;
}

@Injectable()
export class GLRecord {
  batchHeader: BatchHeader;
  jv: {
    header: JVHeader;
    details: JVDetails[];
  }[];
  trailer: JVTrailer;
}
