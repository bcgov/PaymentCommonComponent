import {AppLogger} from '../src/common/logger.service';
import { Test, TestingModule } from '@nestjs/testing';
import { tdi17Keys } from './fixtures/flatFileKeys';
import tdi17 from './outputs/TDI17.json';
import tdi17Sample from './fixtures/tdi17Sample.json';
import * as fs from 'fs';
import path from 'path';

describe('TDI17', () => {
  let testLogger: AppLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLogger, { provide: 'winston', useValue: jest.fn() }]
    }).compile();
    testLogger = module.get<AppLogger>(AppLogger);
  });

  it('Verifies TDI TXT to TDI json', () => {
    const textfile = fs.readFileSync(
      path.join(__dirname, '../sample-files/TDI17.TXT')
    );

    const textFileArr = textfile.toString().split('\n');

    textFileArr.splice(textFileArr.length - 1, 1);
    textFileArr.splice(0, 1);
    testLogger.log(`Sample TDI 17.TXT:\n\n${textFileArr[2]}\n\n${textFileArr[7]}\n\n${textFileArr[11]}`);
    
    expect(tdi17.details.length).toEqual(textFileArr.length);

    testLogger.log(`/Parsed as:\n\n${tdi17.details[2]}\n\n${tdi17.details[7]}\n\n${tdi17.details[11]}/`);

    expect(Object.keys(tdi17.details[0])).toEqual(tdi17Keys);

    expect(Object.values(tdi17.details[2])).toEqual(Object.values(tdi17Sample[0]))
    expect(Object.values(tdi17.details[7])).toEqual(Object.values(tdi17Sample[1]))
    expect(Object.values(tdi17.details[11])).toEqual(Object.values(tdi17Sample[2]))
  });
});