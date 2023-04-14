import { faker } from '@faker-js/faker';
import { BaseData } from './base-data';
import { Location } from '../types/interface';
import { Ministries } from '../../../../src/constants';
import { CashDepositEntity } from '../../../../src/deposits/entities/cash-deposit.entity';
/*eslint-disable */

export class CashDeposit extends CashDepositEntity {
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
