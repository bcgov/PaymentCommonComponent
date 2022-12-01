import { tdi17Keys } from './fixtures/flatFileKeys';
import tdi17 from './outputs/TDI17.json';
import tdi17Sample from './fixtures/samples/tdi17Sample.json';
import * as fs from 'fs';
import path from 'path';

describe('TDI17', () => {
  it('Verifies TDI TXT to TDI json', () => {
    const textfile = fs.readFileSync(
      path.join(__dirname, '../sample-files/TDI17.TXT')
    );

    const textFileArr = textfile.toString().split('\n');

    textFileArr.splice(textFileArr.length - 1, 1);
    textFileArr.splice(0, 1);

    expect(tdi17.details.length).toEqual(textFileArr.length);

    expect(Object.keys(tdi17.details[0])).toEqual(tdi17Keys);

    expect(Object.values(tdi17.details[2])).toEqual(
      Object.values(tdi17Sample[0])
    );
    expect(Object.values(tdi17.details[7])).toEqual(
      Object.values(tdi17Sample[1])
    );
    expect(Object.values(tdi17.details[11])).toEqual(
      Object.values(tdi17Sample[2])
    );
  });
});
