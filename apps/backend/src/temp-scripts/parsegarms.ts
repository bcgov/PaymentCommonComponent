import { TransactionDTO } from '../sales/dto/transaction.dto';

export const parseSales = (garmsJson: any[]) => {
  const out: TransactionDTO[] = garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      payment_total,
      payments,
      source
    }) => ({
      transaction_id: sales_transaction_id,
      transaction_date: sales_transaction_date.split('').splice(0, 10).join(''),
      transaction_time: sales_transaction_date
        .split('')
        .splice(11, 10)
        .join(''),
      location_id: parseInt(source.location_id),
      payments: payments.map(
        ({ amount, method, exchange_rate, currency }: any) => ({
          amount,
          method,
          exchange_rate,
          currency
        })
      ),
      payment_total: parseFloat(payment_total)
    })
  );
  /* eslint-disable no-console */
  console.log(JSON.stringify(out));
  return JSON.stringify(out);
};
