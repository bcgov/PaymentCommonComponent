export const parseSales = (garmsJson: any[]) => {
  const out = garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      payment_total,
      payments,
      source
    }) => ({
      transaction_id: sales_transaction_id,
      transaction_date: sales_transaction_date.split('').splice(0, 10).join(''),
      transaction_time: sales_transaction_date.split('').splice(11, 9).join(''),
      location_id: parseInt(source.location_id),
      payments: payments.map(
        ({ amount, method, currency, exchange_rate }: any) => ({
          amount,
          method,
          currency,
          exchange_rate
        })
      ),
      payment_total
    })
  );
  /* eslint-disable no-console */
  console.log(JSON.stringify(out));
  return JSON.stringify(out);
};
