import * as fs from 'fs';
import path from 'path';
import { ParseArgsTDI, FileTypes } from '../../../src/constants';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { TDI17Details } from '../../../src/flat-files';
import { parseTDI, parseTDIHeader } from '../../../src/lambdas/utils/parseTDI';

test('Cash Deposit Entity Instance', () => {
  const testFile = fs.readFileSync(
    path.join(__dirname, '../../fixtures/TDI17.TXT')
  );
  const header = parseTDIHeader(FileTypes.TDI17, testFile.toString());
  const tdi17Mock: ParseArgsTDI = {
    type: FileTypes.TDI17,
    fileName: 'sbc/PROD_SBC_F08TDI17_20230509.DAT',
    program: 'SBC',
    fileContents: Buffer.from(testFile).toString(),
    header,
  };
  const data: TDI17Details[] = [...parseTDI(tdi17Mock)] as TDI17Details[];
  const cashDeposit: CashDepositEntity[] = data.map(
    (itm) => new CashDepositEntity(itm)
  );
  expect(cashDeposit[0]).toEqual(data[0].resource);
});
