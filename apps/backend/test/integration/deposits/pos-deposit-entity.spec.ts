import * as fs from 'fs';
import path from 'path';
import { ParseArgsTDI, FileTypes } from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { TDI34Details } from '../../../src/flat-files';
import { parseTDI } from '../../../src/lambdas/utils/parseTDI';

test('Pos Deposit Entity Instance', () => {
  const testFile = fs.readFileSync(
    path.join(__dirname, '../../fixtures/TDI34.TXT')
  );
  const tdi34Mock: ParseArgsTDI = {
    type: FileTypes.TDI34,
    fileName: 'sbc/PROD_SBC_F08TDI34_20230515.DAT',
    program: 'SBC',
    fileContents: Buffer.from(testFile).toString(),
  };
  const data: TDI34Details[] = [...parseTDI(tdi34Mock)] as TDI34Details[];
  const posDeposit: POSDepositEntity[] = data.map(
    (itm) => new POSDepositEntity(itm)
  );
  expect(posDeposit[0]).toEqual(data[0].resource);
});
