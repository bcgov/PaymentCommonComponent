import * as fs from 'fs';
import path from 'path';
import { tdi34Keys } from './fixtures/flatFileKeys';
import tdi34Sample from './fixtures/samples/tdi34Sample.json';
import tdi34 from './outputs/TDI34.json';

describe('TDI34', () => {
  it('Verifies TDI TXT to TDI json', () => {
    const textfile = fs.readFileSync(
      path.join(__dirname, '../../sample-files/TDI34.TXT')
    );
    const textFileArr = textfile.toString().split('\n');
    textFileArr.splice(textFileArr.length - 1, 1);
    textFileArr.splice(0, 1);

    expect(tdi34.details.length).toEqual(textFileArr.length);
    expect(Object.keys(tdi34.details[0])).toEqual(tdi34Keys);

    expect(Object.values(tdi34.details[3])).toEqual(
      Object.values(tdi34Sample[3])
    );
    expect(Object.values(tdi34.details[7])).toEqual(
      Object.values(tdi34Sample[7])
    );
    expect(Object.values(tdi34.details[9])).toEqual(
      Object.values(tdi34Sample[9])
    );
  });
});
