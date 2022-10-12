import * as fs from 'fs';
import { join } from 'path';
// const file = fs.readFileSync(join(__dirname, './data.txt'), 'utf-8');

import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import {
  BatchHeader,
  GLRecord,
  JVDetails,
  JVHeader,
  JVTrailer,
} from '../dto/jv.dto';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

/**
 * Design this function to trigger existing NestJs appliation services without Api-Getway
 * All the schedule and backgroud job trigger will be added here.
 * Opertion like sync data, update database view or trigger db function, etc.
 */
export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const s3manager = app.get(S3ManagerService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });

  try {
    appLogger.log('...start GL Generation');
    const contents = await s3manager.getContents(
      'pcc-data',
      'sales/aggregate/gl.json',
    );
    const json = contents.Body?.toString() || '';
    const glRecord = JSON.parse(json) as GLRecord;

    const output = generateGL(glRecord);
    await s3manager.putObject('pcc-data', 'sales/aggregate/test2', output);
  } catch (e) {
    appLogger.error(e);
  }
  appLogger.log('...end GL Generation');
};

const generateGL = (glRecord: GLRecord) => {
  glRecord.batchHeader = new BatchHeader(glRecord.batchHeader)
  glRecord.trailer = new JVTrailer(glRecord.trailer)
  glRecord.jv = glRecord.jv.map(jv => {
    jv.header = new JVHeader(jv.header);
    jv.details = jv.details.map(details => {
      return new JVDetails(details);
    })
    return jv
  })
  return convertToFixedWidth(glRecord);
};

const parseGL = (file: string): Buffer => {
  const lines = file.split('\n').filter((l: string) => l);

  const glRecord = new GLRecord();
  glRecord.jv = [];
  const theMap = new Map<
    string,
    {
      header: JVHeader;
      details: JVDetails[];
    }
  >();
  lines.forEach((line: string, idx: number) => {
    if (line.slice(6, 8) === 'JH') {
      const trans = new JVHeader();
      trans.convertToJson(line);
      theMap.set(trans.journalName, { header: trans, details: [] });
    } else if (line.slice(6, 8) === 'JD') {
      const trans = new JVDetails();
      trans.convertToJson(line);
      const { details, header } = theMap.get(trans.journalName) || {};
      if (header && details) {
        theMap.set(trans.journalName, {
          details: details.concat(trans),
          header: header,
        });
      }
    } else if (line.slice(6, 8) === 'BH') {
      const trans = new BatchHeader();
      trans.convertToJson(line);
      glRecord.batchHeader = trans;
    } else if (line.slice(6, 8) === 'BT') {
      const trans = new JVTrailer();
      trans.convertToJson(line);
      glRecord.trailer = trans;
    } else {
      console.log(line.slice(6, 7), 'THIS FAILED');
    }
  });
  glRecord.jv = Array.from(theMap.values());
  return convertToFixedWidth(glRecord);
};

const convertToFixedWidth = (glRecord: GLRecord) => {
  const BH = glRecord.batchHeader.convertFromJson();
  const BT = glRecord.trailer.convertFromJson();

  let result = Buffer.concat([BH]);
  glRecord.jv.forEach((key) => {
    result = Buffer.concat([
      result,
      key.header?.convertFromJson() || Buffer.from(''),
    ]);
    key.details?.forEach((key1) => {
      result = Buffer.concat([
        result,
        key1?.convertFromJson() || Buffer.from(''),
      ]);
    });
  });
  return Buffer.concat([result, BT]);
};

handler();
