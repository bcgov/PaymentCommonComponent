import { faker } from '@faker-js/faker';
import { PaymentMock } from './payment_mock';
import { FileMetadata } from './../../../src/common/columns/metadata';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { MinistryLocationEntity } from '../../../src/location/entities';

/*eslint-disable */
export class POSDepositMock extends POSDepositEntity {
  constructor(
    location: MinistryLocationEntity,
    metadata: FileMetadata,
    payment: PaymentMock,
    status?: MatchStatus
  ) {
    super();

    this.id = faker.string.uuid();
    this.metadata = metadata;
    (this.merchant_id = location.merchants[0].merchant_id),
      (this.transaction_date = payment.transaction.transaction_date);
    this.transaction_time = payment.transaction.transaction_time;
    this.transaction_amt = payment.amount;
    this.payment_method = payment.payment_method;
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
