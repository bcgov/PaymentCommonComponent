import { faker } from '@faker-js/faker';
import { Payment } from './payment_mock';
import { Transaction } from './transaction_mock';
import { BaseData } from '../types/interface';
import { FileMetadata } from './../../../src/common/columns/metadata';
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
  transaction_time: string;
  transaction_amt: number;
  merchant_id: number;
  payment_method: PaymentMethodEntity;
  status: MatchStatus;
  metadata: FileMetadata;
  card_vendor: string;

  constructor(
    baseData: BaseData,
    metadata: FileMetadata,
    payment: Payment,
    transaction: Transaction,
    status?: MatchStatus
  ) {
    super();
    this.id = '1';
    this.card_vendor = payment.payment_method.method;
    this.metadata = metadata;
    this.program = baseData.program;
    this.location = baseData.location;
    this.merchant_id = baseData.location.merchant_id;
    this.transaction_date = transaction.transaction_date;
    this.transaction_time = transaction.transaction_time;
    this.transaction_amt = payment.amount;
    this.payment_method = new PaymentMethodEntity(payment.payment_method);
    this.status = status ?? faker.helpers.arrayElement(MatchStatusAll);
  }
}
