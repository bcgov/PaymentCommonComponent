import { faker } from '@faker-js/faker';
import {
  differenceInBusinessDays,
  differenceInMinutes,
  format,
  getTime,
  parse,
  subBusinessDays,
} from 'date-fns';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { AggregatedPayment } from '../../../src/reconciliation/types';
import { PaymentEntity } from '../../../src/transaction/entities';
import { paymentMethods } from '../../../test/mocks/const/payment-methods';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';

export const aggregatePayments = (payments: PaymentEntity[]) => {
  const groupedPayments = payments.reduce(
    /*eslint-disable */
    (acc: any, payment: PaymentEntity) => {
      const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
      if (!acc[key]) {
        acc[key] = {
          status: payment.status,
          fiscal_close_date: payment.transaction.fiscal_close_date,
          amount: 0,
          payments: [],
        };
      }
      acc[key].amount += parseFloat(payment.amount.toFixed(2));
      acc[key].payments.push(payment);
      return acc;
    },
    {}
  );
  const aggPayments: AggregatedPayment[] = Object.values(groupedPayments);
  return aggPayments.sort(
    (a: AggregatedPayment, b: AggregatedPayment) => a.amount - b.amount
  );
};

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
            transaction_time: format(
              getTime(
                parse(
                  `${itm.transaction.transaction_date} ${itm.transaction.transaction_time}`,
                  'yyyy-MM-dd HH:mm:ss',
                  new Date()
                )
              ) +
                1000 * 60 * 20,
              'HH:mm:ss'
            ),
          },
        }
      : {
          ...itm,
          timestamp: itm.timestamp,
        }
  );
};

export const setSomePaymentsToOneBusinessDayBehind = (
  payments: PaymentEntity[]
) => {
  return payments.map((itm) => ({
    ...itm,
    timestamp: itm.timestamp,
    transaction: {
      ...itm.transaction,
      transaction_date: format(
        subBusinessDays(new Date(itm.transaction.transaction_date), 1),
        'yyyy-MM-dd'
      ),
    },
  }));
};

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
        location: faker.helpers.arrayElement(locations),
      },
      timestamp: parse(
        format(faker.date.recent(10), 'yyyy-MM-dd'),
        'yyyy-MM-dd',
        new Date()
      ),
      amount: faker.datatype.number({ min: 1, max: 1000 }),
      payment_method: faker.helpers.arrayElement(paymentMethods),
    })),
    deposits: posData.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      transaction_amt: faker.datatype.number({ min: 1, max: 1000 }),
    })),
  };
};

export const timeBetweenMatchedPaymentAndDeposit = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) =>
  differenceInMinutes(
    parse(
      `${payment.transaction.transaction_date} ${payment.transaction.transaction_time}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    ),
    parse(
      `${deposit.transaction_date} ${deposit.transaction_time}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    )
  );

export const roundOneTimeHeuristic = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) => timeBetweenMatchedPaymentAndDeposit(payment, deposit) <= 5;

export const roundTwoTimeHeuristic = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) =>
  timeBetweenMatchedPaymentAndDeposit(payment, deposit) >= 5 &&
  timeBetweenMatchedPaymentAndDeposit(payment, deposit) <= 1440;

export const roundThreeTimeHeuristic = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) =>
  differenceInBusinessDays(
    parse(
      `${payment.transaction.transaction_date} ${payment.transaction.transaction_time}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    ),
    parse(
      `${deposit.transaction_date} ${deposit.transaction_time}`,
      'yyyy-MM-dd HH:mm:ss',
      new Date()
    )
  ) < 2;
