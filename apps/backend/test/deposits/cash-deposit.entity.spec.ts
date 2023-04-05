import * as fs from 'fs';
import path from 'path';
import { ParseArgsTDI, FileTypes } from '../../src/constants';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';
import { TDI17Details } from '../../src/flat-files';
import { parseTDI } from '../../src/lambdas/utils/parseTDI';

test('Cash Deposit Entity Instance', () => {
  const testFile = fs.readFileSync(
    path.join(__dirname, '../../sample-files/TDI17.TXT')
  );
  const tdi17Mock: ParseArgsTDI = {
    type: FileTypes.TDI17,
    fileName: 'test/TDI17',
    program: 'SBC',
    fileContents: Buffer.from(testFile).toString()
  };
  const data: TDI17Details[] = [...parseTDI(tdi17Mock)] as TDI17Details[];
  const cashDeposit: CashDepositEntity[] = data.map(
    (itm) => new CashDepositEntity(itm)
  );
  expect(cashDeposit[0]).toEqual(data[0].resource);
});
