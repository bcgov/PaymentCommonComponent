import { faker } from '@faker-js/faker';
import { BaseData } from './base-data';
import { Payment } from './payment';
import { Transaction } from './transaction';
import { Location } from '../types/interface';
import { POSDepositEntity } from './../../../../src/deposits/entities/pos-deposit.entity';
import { Ministries } from '../../../../src/constants';
import { PaymentMethodEntity } from '../../../../src/transaction/entities';

/*eslint-disable */
export class POSDeposit extends POSDepositEntity {
  id: string;
  program: Ministries;
  location: Location;
  transaction_date: Date;
  transaction_amt: number;
  paymentMethod: PaymentMethodEntity;
  constructor(baseData: BaseData, payment: Payment, transaction: Transaction) {
    super();
    this.id = `${faker.datatype.uuid()}`;
    this.program = baseData.program;
    this.location = baseData.location;
    this.transaction_date = transaction.transaction_date;
    this.transaction_amt = payment.amount;
    this.paymentMethod = payment.payment_method;
  }
}
