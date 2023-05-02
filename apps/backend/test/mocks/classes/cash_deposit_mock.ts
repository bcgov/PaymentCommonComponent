import { faker } from '@faker-js/faker';
import { BaseData } from '../types/interface';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { Ministries } from '../../../src/constants';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';
/*eslint-disable */

export class CashDeposit extends CashDepositEntity {
  program: Ministries;
  location: LocationEntity;
  deposit_date: string;
  deposit_amt_cdn: number;
  status: MatchStatus;
  constructor(data: BaseData, amount: number, status?: MatchStatus) {
    super();
    this.id = '1';
    this.program = data.program;
    this.location = data.location;
    this.deposit_date = data.dateRange.to_date;
    this.deposit_amt_cdn = amount;
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
