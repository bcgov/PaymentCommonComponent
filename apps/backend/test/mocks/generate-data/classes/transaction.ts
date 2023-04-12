import { faker } from '@faker-js/faker';
import { BaseData } from './base-data';
import { Payment } from './payment';
import { Location } from '../types/interface';
import { Ministries } from '../../../../src/constants';

/*eslint-disable */

export class Transaction {
  transaction_id: string;
  program: Ministries;
  location: Location;
  transaction_date: Date;
  total_payment_amount: number;
  fiscal_close_date: Date;
  payments: Payment[];

  constructor(data: BaseData, payments: Payment[]) {
    this.transaction_id = `${faker.datatype.uuid()}`;
    this.program = data.program;
    this.location = data.location;
    this.fiscal_close_date = faker.date.between(
      `${data.dateRange.from_date}`,
      `${data.dateRange.to_date}`
    );
    this.transaction_date = faker.date.between(
      `${data.dateRange.from_date}`,
      `${data.dateRange.to_date}`
    );
    this.total_payment_amount = payments.reduce(
      (acc: any, payment: Payment) => (acc += payment.amount),
      0
    );

    this.payments = payments;
  }
}
