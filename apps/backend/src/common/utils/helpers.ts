import { AggregatedPayment } from '../../../src/reconciliation/types';
import { PaymentEntity } from '../../../src/transaction/entities';

export const aggregatedPayments = (payments: PaymentEntity[]) => {
  const groupedPayments = payments.reduce(
    /*eslint-disable */
    (acc: any, payment: PaymentEntity) => {
      const key = `${payment.transaction.fiscal_close_date}${payment.status}`;
      if (!acc[key]) {
        acc[key] = {
          status: payment.status,
          fiscal_close_date: payment.transaction.fiscal_close_date,
          amount: 0,
          payments: []
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
