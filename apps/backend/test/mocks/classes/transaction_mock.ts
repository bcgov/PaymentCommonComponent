import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import { PaymentMock } from './payment_mock';
import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';
import { Ministries } from '../../../src/constants';
import { DateRange } from '../../../src/constants';
import { LocationEntity } from '../../../src/location/entities';
import { TransactionEntity } from '../../../src/transaction/entities';

/*eslint-disable */
export class TransactionMock extends TransactionEntity {
  constructor(
    dateRange: DateRange,
    program: Ministries,
    location: LocationEntity,
    payments: PaymentMock[]
  ) {
    super();

    this.transaction_id = `${faker.datatype.uuid()}`;
    this.fiscal_close_date = format(
      faker.date.between(`${dateRange.from_date}`, `${dateRange.to_date}`),
      'yyyy-MM-dd'
    );
    this.source_id = program;
    this.location_id = location.location_id;
    this.transaction_date = dateRange.to_date;
    this.transaction_time = `${faker.datatype.number({
      min: 0,
      max: 1,
    })}${faker.datatype.number({
      min: 0,
      max: 9,
    })}:00:00`;
    this.total_transaction_amount = payments.reduce(
      (acc: any, payment: PaymentEntity) => (acc += payment.amount),
      0
    );
    this.payments = payments;
  }
}
