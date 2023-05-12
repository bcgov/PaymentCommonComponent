import { faker } from '@faker-js/faker';
import { differenceInMinutes, format, getTime, parse } from 'date-fns';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { PaymentEntity } from '../../../src/transaction/entities';
import { paymentMethods } from '../../../test/mocks/const/payment-methods';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';

export const setSomePaymentsToTwentyMinutesLater = (
  payments: PaymentEntity[]
) => {
  return payments.map((itm: PaymentEntity, index: number) =>
    index % 2 === 0
      ? {
          ...itm,
          timestamp: itm.timestamp,
          transaction: {
            ...itm.transaction,
            transaction_time: setTransactionTimeAheadBy20Minutes(
              itm.transaction.transaction_date,
              itm.transaction.transaction_time
            )
          }
        }
      : {
          ...itm,
          timestamp: itm.timestamp
        }
  );
};

export const setTransactionTimeAheadBy20Minutes = (
  date: string,
  time: string
) =>
  format(
    getTime(parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm:ss', new Date())) +
      1000 * 60 * 20,
    'HH:mm:ss'
  );

export const unmatchedTestData = (
  data: MockData
): { payments: PaymentEntity[]; deposits: POSDepositEntity[] } => {
  const paymentData = data.paymentsMock;
  const posData = data.depositsMock as POSDepositEntity[];
  return {
    payments: paymentData.map((itm) => ({
      ...itm,
      transaction: {
        ...itm.transaction,
        transaction_date: format(faker.date.recent(10), 'yyyy-MM-dd'),
        location: faker.helpers.arrayElement(locations)
      },
      timestamp: parse(
        format(faker.date.recent(10), 'yyyy-MM-dd'),
        'yyyy-MM-dd',
        new Date()
      ),
      amount: faker.datatype.number({ min: 1, max: 1000 }),
      payment_method: faker.helpers.arrayElement(paymentMethods)
    })),
    deposits: posData.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      transaction_amt: faker.datatype.number({ min: 1, max: 1000 })
    }))
  };
};

export const timeBetweenMatchedPaymentAndDeposit = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) =>
  differenceInMinutes(
    parse(payment.transaction.transaction_time, 'HH:mm:ss', new Date()),
    parse(deposit.transaction_time, 'HH:mm:ss', new Date())
  );
