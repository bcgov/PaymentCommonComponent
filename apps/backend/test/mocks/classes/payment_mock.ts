import { faker } from '@faker-js/faker';
import { paymentMethods } from '../const/payment-methods';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { PaymentMethodClassification } from '../../../src/constants';
import { PaymentMethodEntity } from '../../../src/transaction/entities';
import { PaymentEntity } from '../../../src/transaction/entities/payment.entity';

export class Payment extends PaymentEntity {
  id: string;
  payment_method: PaymentMethodEntity;
  amount: number;
  constructor(
    classification: PaymentMethodClassification,
    status?: MatchStatus
  ) {
    super();
    this.id = `${faker.datatype.uuid()}`;
    this.amount = Math.abs(
      faker.datatype.number({ min: 1, max: 1000, precision: 0.01 })
    );
    this.payment_method = faker.helpers.arrayElement(
      paymentMethods.filter((itm) => itm.classification === classification)
    );
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
