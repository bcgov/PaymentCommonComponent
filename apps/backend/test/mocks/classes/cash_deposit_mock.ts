import { faker } from '@faker-js/faker';
import { FileMetadata } from 'src/common/columns';
import { DateRange } from './../../../dist/src/constants.d';
import { LocationEntity } from './../../../src/location/entities/master-location-data.entity';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
/*eslint-disable */

export class CashDepositMock extends CashDepositEntity {
  constructor(
    dateRange: DateRange,
    location: LocationEntity,
    metadata: FileMetadata,
    amount: number,
    status?: MatchStatus
  ) {
    super();
    this.id = faker.datatype.uuid();
    this.deposit_date = dateRange.to_date;
    this.metadata = metadata;
    this.deposit_amt_cdn = amount;
    this.pt_location_id = location.pt_location_id;
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
