import { faker } from '@faker-js/faker';
import {
  differenceInBusinessDays,
  differenceInMinutes,
  format,
  getTime,
  parse,
} from 'date-fns';
import Decimal from 'decimal.js';
import { subtractBusinessDaysNoTimezone } from '../../../src/common/utils/format';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { AggregatedCashPayment } from '../../../src/reconciliation/types';
import { PaymentEntity } from '../../../src/transaction/entities';
import { paymentMethods } from '../../../test/mocks/const/payment-methods';
import { locations } from '../../mocks/const/locations';
import { MockData } from '../../mocks/mocks';
/**
 * Aggregates the cash payments by fiscal close date and status in order to match 1:1 to a cash deposit
 * @param {PaymentEntity[]} payments
 * @returns {AggregatedPayment[]}
 */
export const aggregatePayments = (
  payments: PaymentEntity[]
): AggregatedCashPayment[] => {
  const groupedPayments = payments.reduce(
    /*eslint-disable */
    (acc: { [key: string]: AggregatedCashPayment }, payment: PaymentEntity) => {
      const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
      if (!acc[key]) {
        acc[key] = {
          status: payment.status,
          classification: payment.payment_method.classification,
          location_id: payment.transaction.location.location_id,
          fiscal_close_date: payment.transaction.fiscal_close_date,
          amount: new Decimal(0),
          payments: [],
        };
      }
      acc[key].amount = acc[key].amount.plus(payment.amount);
      acc[key].payments.push(payment);
      return acc;
    },
    {}
  );
  const aggPayments: AggregatedCashPayment[] = Object.values(groupedPayments);
  return aggPayments.sort(
    (a: AggregatedCashPayment, b: AggregatedCashPayment) =>
      a.amount.minus(b.amount).toNumber()
  );
};
/**
 * Used for testing round two heuristics in POS reconciliation
 * @param {PaymentEntity[]} payments
 * @returns
 */
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
/**
 * Used for testing round three heuristics in POS reconciliation
 * @param {PaymentEntity[]} payments
 * @returns
 */
export const setSomeDepositsToOneBusinessDayBehind = (
  deposits: POSDepositEntity[]
) => {
  return deposits.map((itm) => {
    const newDate = subtractBusinessDaysNoTimezone(itm.transaction_date, 1);
    return {
      ...itm,
      timestamp: itm.timestamp,
      transaction_date: newDate,
    };
  });
};
/**
 * Used for creating "bad" test data
 * @param {MockData[]} data
 * @returns
 */
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
        transaction_date: format(faker.date.recent({ days: 10 }), 'yyyy-MM-dd'),
        location: faker.helpers.arrayElement(locations),
      },
      timestamp: parse(
        format(faker.date.recent({ days: 10 }), 'yyyy-MM-dd'),
        'yyyy-MM-dd',
        new Date()
      ),
      amount: faker.number.int({ min: 1, max: 1000 }),
      payment_method: faker.helpers.arrayElement(paymentMethods),
    })),
    deposits: posData.map((itm) => ({
      ...itm,
      timestamp: itm.timestamp,
      transaction_amt: faker.number.int({ min: 1, max: 1000 }),
    })),
  };
};
/**
 * Calculates the time between a matched payment and deposit
 * @param {PaymentEntity} payment
 * @param {POSDepositEntity} deposit
 * @returns {number}
 */
export const timeBetweenMatchedPaymentAndDeposit = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
): number =>
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
/**
 * Verify's a match based on the rules for round one heuristics (< 5 mins time difference)
 * @param {PaymentEntity} payment
 * @param {POSDepositEntity} deposit
 * @returns {boolean}
 */
export const roundOneTimeHeuristic = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) => timeBetweenMatchedPaymentAndDeposit(payment, deposit) <= 5;
/**
 * Verify's a match based on the rules for round two heuristics (date match - no time match)
 * @param {PaymentEntity} payment
 * @param {POSDepositEntity} deposit
 * @returns {boolean}
 */
export const roundTwoTimeHeuristic = (
  payment: PaymentEntity,
  deposit: POSDepositEntity
) =>
  timeBetweenMatchedPaymentAndDeposit(payment, deposit) >= 5 &&
  payment.transaction.transaction_date === deposit.transaction_date;
/**
 * Verify's a match based on the rules for round three heuristics (look back one business day)
 * @param {PaymentEntity} payment
 * @param {POSDepositEntity} deposit
 * @returns {boolean}
 */
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
