import {
  Column,
  DataType
} from '../common/fixedWidthRecord/fixedWidthRecord.decorator';
import {
  FixedWidthRecord,
  IFixedWidthRecord
} from '../common/fixedWidthRecord/fixedWidthRecord';
import { transformSalesEventOptions } from '../common/fixedWidthRecord/Resource';
import { DistributionDTO } from '../sales/dto/distribution.dto';
import { FEEDER_NUMBER } from './constants';

export interface IJVDetails extends IFixedWidthRecord<IJVDetails> {
  feederNumber1?: number;
  batchType?: string;
  transactionType?: string;
  journalName?: string;
  jvLineNumber?: string;
  glEffectiveDate?: string;
  distributionAck?: string;
  supplierNumber?: string;
  amountOfLine?: string;
  lineCode?: string;
  lineDescription?: string;
  flowThru?: string;
}

export const JV_DETAILS_TX_TYPE = 'JD';
export const JV_DETAILS_BATCH_TYPE = 'GI';

export class JVDetails
  extends FixedWidthRecord<IJVDetails>
  implements IJVDetails
{
  public static readonly resourceType = 'JVDetails';
  public static readonly delimiter = {
    value: '',
    positions: [8, 317],
    length: 1
  };
  constructor(init?: any) {
    super(init);
  }

  public static transformSalesEvent(
    record: DistributionDTO,
    options: transformSalesEventOptions
  ) {
    return new JVDetails({
      feederNumber1: FEEDER_NUMBER,
      batchType: JV_DETAILS_BATCH_TYPE,
      transactionType: JV_DETAILS_TX_TYPE,
      journalName: options.journalName,
      jvLineNumber: record.line_number,
      glEffectiveDate: record.gl_date,
      distributionAck: `${record.dist_client_code}${record.dist_resp_code}${record.dist_service_line_code}${record.dist_stob_code}${record.dist_project_code}${record.dist_location_code}${record.dist_future_code}`, //'02232OCG00000157632000000000000000',
      supplierNumber: record.supplier_code,
      amountOfLine: record.line_amount,
      lineCode: record.line_code,
      lineDescription: record.line_description,
      flowThru: ''
    });
  }

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

  @Column({ start: 9, width: 10 })
  public get journalName() {
    return this.resource.journalName;
  }

  public set journalName(data) {
    this.resource.journalName = data;
  }

  @Column({ start: 19, width: 5 })
  public get jvLineNumber() {
    return this.resource.jvLineNumber;
  }

  public set jvLineNumber(data) {
    this.resource.jvLineNumber = data;
  }

  @Column({ start: 24, width: 8 })
  public get glEffectiveDate() {
    return this.resource.glEffectiveDate;
  }

  public set glEffectiveDate(data) {
    this.resource.glEffectiveDate = data;
  }

  @Column({ start: 32, width: 50 })
  public get distributionAck() {
    return this.resource.distributionAck;
  }

  public set distributionAck(data) {
    this.resource.distributionAck = data;
  }

  @Column({ start: 82, width: 9 })
  public get supplierNumber() {
    return this.resource.supplierNumber;
  }

  public set supplierNumber(data) {
    this.resource.supplierNumber = data;
  }

  @Column({ start: 91, width: 15 })
  public get amountOfLine() {
    return this.resource.amountOfLine;
  }

  public set amountOfLine(data) {
    this.resource.amountOfLine = data;
  }

  @Column({ start: 106, width: 1 })
  public get lineCode() {
    return this.resource.lineCode;
  }

  public set lineCode(data) {
    this.resource.lineCode = data;
  }

  @Column({ start: 107, width: 100 })
  public get lineDescription() {
    return this.resource.lineDescription;
  }

  public set lineDescription(data) {
    this.resource.lineDescription = data;
  }

  @Column({ start: 207, width: 110 })
  public get flowThru() {
    return this.resource.flowThru;
  }

  public set flowThru(data) {
    this.resource.flowThru = data;
  }
}
