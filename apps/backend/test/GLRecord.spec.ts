import { GLRecord } from '../src/cgi-feeder/GLRecord';
import { TransactionDTO } from '../src/transaction/transaction.dto';

const salesRecord = require('./fixtures/sale.json');
describe('GLRecord', () => {
  it('transform from sales event ', () => {
    const glRecord = GLRecord.transformSalesEvent([salesRecord as TransactionDTO]);
    expect(glRecord.batchHeader).toHaveProperty('transactionType', 'BH');
  });
});
