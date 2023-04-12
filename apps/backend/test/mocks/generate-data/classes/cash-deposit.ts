import { faker } from '@faker-js/faker';
import { FileMetadata } from 'aws-sdk/clients/codecommit';
import { BaseData } from './base-data';
import { Location } from '../types/interface';
import { MatchStatus } from '../../../../src/common/const';
import { Ministries } from '../../../../src/constants';
/*eslint-disable */

class CashDepositBase {
  metadata: FileMetadata;
  deposit_amt_curr: number;
  source_file_type: string;
  pt_location_id: number;
  deposit_time: string;
  seq_no: string;
  location_desc: string;
  currency: string;
  exchange_adj_amt: number;
  destination_bank_no: string;
  batch_no: string;
  jv_type: string;
  jv_no: string;
  status: MatchStatus;
}
export class CashDeposit extends CashDepositBase {
  id: string;
  program: Ministries;
  location: Location;
  deposit_date: Date;
  deposit_amt_cdn: number;

  constructor(data: BaseData, amount: number) {
    super();
    this.id = `${faker.datatype.uuid()}`;
    this.program = data.program;
    this.location = data.location;
    this.deposit_date = data.dateRange.to_date;
    this.deposit_amt_cdn = amount;
  }
}
