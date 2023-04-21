import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { BaseData } from './base-data';
import { Payment } from './payment';
import { Location } from '../types/interface';
import { Ministries } from '../../../../src/constants';
import { TransactionEntity } from '../../../../src/transaction/entities';

/*eslint-disable */

export class Transaction extends TransactionEntity {
  transaction_id: string;
  program: Ministries;
  location: Location;
  transaction_date: string;
  total_payment_amount: number;
  fiscal_close_date: string;
  payments: Payment[];

  constructor(data: BaseData, payments: Payment[]) {
    super();
    this.transaction_id = `${faker.datatype.uuid()}`;
    this.program = data.program;
    this.location = data.location;
    this.fiscal_close_date = format(
      faker.date.between(
        `${data.dateRange.from_date}`,
        `${data.dateRange.to_date}`
      ),
      'yyyy-MM-dd'
    );

    this.transaction_date = format(
      faker.date.between(
        `${data.dateRange.from_date}`,
        `${data.dateRange.to_date}`
      ),
      'yyyy-MM-dd'
    );
    this.total_payment_amount = payments.reduce(
      (acc: any, payment: Payment) => (acc += payment.amount),
      0
    );
    this.payments = payments;
  }
}
