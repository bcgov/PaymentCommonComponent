import { PaymentEntity } from './../../../src/transaction/entities/payment.entity';

import { MatchStatus } from '../../../src/common/const';
import { FileTypes, PaymentMethodClassification } from '../../../src/constants';

test('Payment Entity Instance', () => {
  const payment: PaymentEntity = new PaymentEntity({
    id: '979532dd-29d9-4a07-81da-291f074b35e4',
    amount: 5.25,
    foreign_currency_amount: undefined,
    currency: 'CAD',
    exchange_rate: 0.0,
    channel: undefined,
    status: MatchStatus.MATCH,
    card_no: undefined,
    merchant_id: undefined,
    device_id: undefined,
    invoice_no: undefined,
    tran_id: undefined,
    order_no: undefined,
    approval_code: undefined,
    payment_method: {
      method: 'P',
      classification: PaymentMethodClassification.POS,
      description: 'Debit',
      sbc_code: 17,
    },
    transaction: {
      payments: [],
      created_at: new Date('2023-01-10T18:45:04.000Z'),
      transaction_id: '20230109-00001-1000005',
      transaction_date: '2023-01-09',
      transaction_time: '18:53:55Z',
      fiscal_close_date: '2023-01-09',
      total_transaction_amount: 161.81,
      void_indicator: false,
      source_id: 'SBC',
      location_id: 1,
      migrated: true,
      source_file_name: 'sbc/SBC_SALES_2023_01_10_18_45_04.JSON',
    },
    cash_deposit_match: undefined,
    pos_deposit_match: {
      timestamp: new Date('2023-04-03T22:47:00Z'),
      id: '540d73d8-5d81-4108-9862-4559f8ad926b',
      status: MatchStatus.MATCH,
      source_file_type: FileTypes.TDI34,
      merchant_id: 22044859,
      card_id: '***************5751',
      transaction_amt: 17.0,
      transaction_date: '2023-04-03',
      transaction_time: '22:47:00Z',
      terminal_no: 'GA2204485903',
      settlement_date: '2023-04-03',
      transaction_code: 10,

      payment_method: {
        method: 'P',
        classification: PaymentMethodClassification.POS,
        description: 'Debit',
        sbc_code: 17,
      },
      metadata: {
        created_at: new Date('2023-04-28T07:35:13.155Z'),
        program: 'SBC',
        source_file_name: 'bcm/PROD_SBC_F08TDI34_20230404.DAT',
        source_file_line: 1550,
        source_file_length: 2116,
      },
    },
  });
  expect(payment).toBeInstanceOf(PaymentEntity);
});
