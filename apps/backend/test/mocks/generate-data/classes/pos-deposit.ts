import { faker } from '@faker-js/faker';
import { BaseData } from './base-data';
import { Payment } from './payment';
import { Transaction } from './transaction';
import { Location, PaymentMethod } from '../types/interface';
import { Ministries } from '../../../../src/constants';

/*eslint-disable */
export class POSDeposit {
  id: string;
  program: Ministries;
  location: Location;
  transaction_date: Date;
  transaction_amt: number;
  paymentMethod: PaymentMethod;
  constructor(baseData: BaseData, payment: Payment, transaction: Transaction) {
    this.id = `${faker.datatype.uuid()}`;
    this.program = baseData.program;
    this.location = baseData.location;
    this.transaction_date = transaction.transaction_date;
    this.transaction_amt = payment.amount;
    this.paymentMethod = payment.method;
  }
}
