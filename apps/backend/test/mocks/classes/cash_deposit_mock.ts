import { faker } from '@faker-js/faker';
import { FileMetadata } from '../../../src/common/columns';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { DateRange } from '../../../src/constants';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { MinistryLocationEntity } from '../../../src/location/entities';
/*eslint-disable */

export class CashDepositMock extends CashDepositEntity {
  constructor(
    dateRange: DateRange,
    location: MinistryLocationEntity,
    metadata: FileMetadata,
    amount: number,
    status?: MatchStatus
  ) {
    super();
    this.id = faker.string.uuid();
    this.deposit_date = dateRange.maxDate;
    this.metadata = metadata;
    this.deposit_amt_cdn = amount;
    this.pt_location_id = location.banks.find(
      (bank) => bank.method === 'Bank'
    )!.bank_id;
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
