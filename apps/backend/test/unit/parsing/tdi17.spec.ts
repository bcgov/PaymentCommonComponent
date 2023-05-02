import * as fs from 'fs';
import path from 'path';
import { tdi17Keys } from '../../fixtures/flatFileKeys';
import tdi17 from '../../fixtures/TDI17.json';
import tdi17Sample from '../../fixtures/tdi17Sample.json';

describe('TDI17', () => {
  it('Verifies TDI TXT to TDI json', () => {
    const textfile = fs.readFileSync(
      path.join(__dirname, '../../../sample-files/TDI17.TXT')
    );

    const textFileArr = textfile.toString().split('\n');

    textFileArr.splice(textFileArr.length - 1, 1);
    textFileArr.splice(0, 1);

    expect(Object.keys(tdi17.details[0])).toEqual(tdi17Keys);

    expect(Object.values(tdi17.details[2])).toEqual(
      Object.values(tdi17Sample[2])
    );
    expect(Object.values(tdi17.details[7])).toEqual(
      Object.values(tdi17Sample[7])
    );
    expect(Object.values(tdi17.details[11])).toEqual(
      Object.values(tdi17Sample[11])
    );
  });
});
