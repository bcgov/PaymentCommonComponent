import { faker } from '@faker-js/faker';
import { Payment } from './payment_mock';
import { Transaction } from './transaction_mock';
import { BaseData } from '../types/interface';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { Ministries } from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';
import { PaymentMethodEntity } from '../../../src/transaction/entities';

/*eslint-disable */
export class POSDeposit extends POSDepositEntity {
  program: Ministries;
  location: LocationEntity;
  transaction_date: string;
  transaction_amt: number;
  paymentMethod: PaymentMethodEntity;
  status: MatchStatus;
  constructor(
    baseData: BaseData,
    payment: Payment,
    transaction: Transaction,
    status?: MatchStatus
  ) {
    super();
    this.id = '1';
    this.program = baseData.program;
    this.location = baseData.location;
    this.transaction_date = transaction.transaction_date;
    this.transaction_amt = payment.amount;
    this.paymentMethod = payment.payment_method;
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
