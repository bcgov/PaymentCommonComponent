import { ddfKeys } from './fixtures/flatFileKeys';
import ddfSample from './fixtures/ddfSample.json';
import ddf from './outputs/DDF.json';
import * as fs from 'fs';
import path from 'path';

describe('DDF', () => {
  it('Verifies DDF TXT to DDF json', () => {
    const textfile = fs.readFileSync(
      path.join(__dirname, '../sample-files/DDF.TXT')
    );
    const textFileArr = textfile.toString().split('\n');
    textFileArr.splice(textFileArr.length - 1, 1);
    textFileArr.splice(0, 1);
    expect(ddf.details.length).toEqual(textFileArr.length);
    expect(Object.keys(ddf.details[0])).toEqual(ddfKeys);
    expect(Object.values(ddf.details[0])).toEqual(Object.values(ddfSample[0]))
    expect(Object.values(ddf.details[7])).toEqual(Object.values(ddfSample[2]))
    expect(Object.values(ddf.details[10])).toEqual(Object.values(ddfSample[1]))
  })
})