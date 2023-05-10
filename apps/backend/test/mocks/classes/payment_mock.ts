import { faker } from '@faker-js/faker';
import { TransactionMock } from './transaction_mock';
import { paymentMethods } from '../const/payment-methods';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { PaymentEntity } from '../../../src/transaction/entities/payment.entity';

export class PaymentMock extends PaymentEntity {
  constructor(
    classification: PaymentMethodClassification,
    transaction: TransactionMock,
    status?: MatchStatus
  ) {
    super();
    this.id = faker.datatype.uuid();
    this.amount = Math.abs(
      faker.datatype.number({ min: 1, max: 1000, precision: 0.01 })
    );
    this.payment_method = faker.helpers.arrayElement(
      paymentMethods.filter((itm) => itm.classification === classification)
    );
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
    this.transaction = transaction;
  }
}
