import { GarmsDTO } from '../../reconciliation/dto/garms.dto';

export const parseGarms = (garmsJson: GarmsDTO[]): any[] => {
  return garmsJson.map(
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
        ({ method, amount, exchange_rate, currency }: any) => ({
          method,
          amount,
          exchange_rate,
          currency
        })
      ),
      payment_total
    })
  );
};
