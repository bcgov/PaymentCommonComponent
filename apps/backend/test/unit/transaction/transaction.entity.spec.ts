import { TransactionEntity } from './../../../src/transaction/entities/transaction.entity';

test('Transaction Entity Instance', () => {
  const transaction = new TransactionEntity({
    payments: [],
    transaction_id: '20230109-00001-1000005',
    transaction_date: '2023-01-09',
    transaction_time: '18:53:55Z',
    fiscal_close_date: '2023-01-09',
    total_transaction_amount: 161.81,
    void_indicator: false,
    source_id: 'SBC',
    location_id: 1,
    migrated: true,
    source_file_name: 'sbc/SBC_SALES_2023_01_10_18_45_04.JSON'
  });

  expect(transaction).toBeInstanceOf(TransactionEntity);
});
