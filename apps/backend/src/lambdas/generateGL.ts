import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { GLRecord, JVHeader, JVDetails, BatchTrailer, BatchHeader } from '../resources';
import { S3ManagerService } from '../s3-manager/s3-manager.service';

export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const s3manager = app.get(S3ManagerService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });

  try {
    appLogger.log('...start GL Generation');
    const contents = await s3manager.getContents(
      process.env.S3_LOCATION || 'bc-pcc-data-files-local',
      'aggregate/gl.json',
    );
    const json = contents.Body?.toString() || '';
    const glRecord = JSON.parse(json) as GLRecord;

    const output = generateGL(glRecord);
    await s3manager.putObject( process.env.S3_LOCATION || 'bc-pcc-data-files-local', 'outputs/cgigl', output);
  } catch (e) {
    appLogger.error(e);
  }
  appLogger.log('...end GL Generation');
};

const generateGL = (glRecord: GLRecord) => {
  return convertToFixedWidth(new GLRecord(glRecord));
};

// const parseGL = (file: string): Buffer => {
//   const lines = file.split('\n').filter((l: string) => l);

//   const glRecord = new GLRecord({});
//   glRecord.jv = [];
//   const theMap = new Map<
//     string,
//     {
//       header: JVHeader;
//       details: JVDetails[];
//     }
//   >();
//   lines.forEach((line: string, idx: number) => {
//     if (line.slice(6, 8) === 'JH') {
//       const trans = new JVHeader({});
//       trans.convertToJson(line);
//       theMap.set(trans.journalName, { header: trans, details: [] });
//     } else if (line.slice(6, 8) === 'JD') {
//       const trans = new JVDetails({});
//       trans.convertToJson(line);
//       const { details, header } = theMap.get(trans.journalName) || {};
//       if (header && details) {
//         theMap.set(trans.journalName, {
//           details: details.concat(trans),
//           header: header,
//         });
//       }
//     } else if (line.slice(6, 8) === 'BH') {
//       const trans = new BatchHeader({});
//       trans.convertToJson(line);
//       glRecord.batchHeader = trans;
//     } else if (line.slice(6, 8) === 'BT') {
//       const trans = new BatchTrailer({});
//       trans.convertToJson(line);
//       glRecord.trailer = trans;
//     } else {
//       console.log(line.slice(6, 7), 'THIS FAILED');
//     }
//   });
//   glRecord.jv = Array.from(theMap.values());
//   return convertToFixedWidth(glRecord);
// };

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
