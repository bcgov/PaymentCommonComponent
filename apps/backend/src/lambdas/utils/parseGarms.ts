import { Ministries } from '../../constants';
import {
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity
} from '../../transaction/entities';
import { SBCGarmsJson, SBCGarmsPayment } from '../../transaction/interface';
import { Transaction } from '../../transaction/interface/transaction.interface';
{
  /*
   * For parsing GARMS Sales JSON into PCC Sales
   */
}

export const parseGarms = async (
  garmsJson: SBCGarmsJson[],
  source_file_name: string,
  paymentMethods: PaymentMethodEntity[]
): Promise<TransactionEntity[]> => {
  return garmsJson.map(
    ({
      sales_transaction_id,
      sales_transaction_date,
      fiscal_close_date,
      payment_total,
      payments,
      source,
      misc,
      distributions,
      revAccounts
    }: SBCGarmsJson) =>
      new TransactionEntity({
        source_id: Ministries.SBC,
        transaction_id: sales_transaction_id,
        transaction_date: sales_transaction_date // TODO: just use slice here
          .split('')
          .splice(0, 10)
          .join(''),
        transaction_time: sales_transaction_date
          .slice(11, 19)
          .replaceAll('.', ':'),
        location_id: parseInt(source.location_id),
        total_transaction_amount: payment_total,
        fiscal_close_date,
        payments: payments.map(
          ({ method, amount, exchange_rate, currency }: SBCGarmsPayment) => {
            return new PaymentEntity({
              method: paymentMethods.find((pm) => {
                return pm.sbc_code === method;
              })?.method,
              currency: currency || 'CAD',
              exchange_rate,
              foreign_currency_amount: currency !== 'CAD' ? amount : undefined,
              amount:
                currency !== 'CAD' && exchange_rate
                  ? parseFloat((amount * (exchange_rate / 100)).toFixed(2))
                  : parseFloat(amount?.toFixed(2))
            });
          }
        ),
        migrated: true,
        source_file_name,
        transactionJson: new Transaction({
          sales_transaction_id,
          sales_transaction_date,
          fiscal_close_date,
          payment_total,
          payments,
          source,
          misc,
          distributions,
          revAccounts
        })
      })
  );
};
