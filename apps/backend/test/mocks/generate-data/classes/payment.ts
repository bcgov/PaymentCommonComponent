import { faker } from '@faker-js/faker';
import { paymentMethods } from '../const/payment-methods';
import { PaymentMethod } from '../types/interface';

export class Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  constructor() {
    this.id = `${faker.datatype.uuid()}`;
    this.amount = Math.abs(
      faker.datatype.number({ min: 1, max: 1000, precision: 0.01 })
    );
    this.method = faker.helpers.arrayElement(paymentMethods);
  }
}
