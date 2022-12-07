import { Test, TestingModule } from '@nestjs/testing';
import { S3 } from 'aws-sdk';
import { handler } from '../src/lambdas/parseFlatFile';
import { S3ManagerService } from '../src/s3-manager/s3-manager.service';
import { S3ManagerModule } from '../src/s3-manager/s3-manager.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import * as fs from 'fs';
import path from 'path';


describe('Parser (e2e)', () => {
  let service: S3ManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        S3ManagerModule,
        AwsSdkModule.forRoot({
          defaultServiceOptions: {
            endpoint: 'http://localstack:4566',
            region: 'ca-central-1',
            s3ForcePathStyle: true
          },
          services: [S3]
        })
      ],
      providers: [S3ManagerService]
    }).compile();
    service = module.get<S3ManagerService>(S3ManagerService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('uploads DDF file to parse', async () => {
    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'test/ddf/DDF.TXT',
      Body: fs.readFileSync(path.join(__dirname, '../sample-files/DDF.TXT'))
    };

    const result = await service.putObject(
      params.Bucket,
      params.Key,
      params.Body
    );

    expect(result).toBeDefined();
  });

  it('gets DDF file from s3', async () => {
    const event = {
      type: 'DDF',
      filepath: 'test/ddf/DDF.TXT',
      outputPath: 'outputs/test/DDF.json'
    };

    await handler(event);

    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'outputs/test/DDF.json'
    };
    const file = await service.getContents(params.Bucket, params.Key);
    const buffer = file.Body && Buffer.from(file.Body.toString() || '');
    fs.createWriteStream(path.join(__dirname, './outputs/DDF.json')).write(
      buffer
    );
  });

  // it('uploads TDI17 file to parse', async () => {
  //   const params = {
  //     Bucket: 'bc-pcc-data-files-local',
  //     Key: 'test/tdi17/TDI17.TXT',
  //     Body: fs.readFileSync(path.join(__dirname, '../sample-files/TDI17.TXT'))
  //   };

  //   const result = await service.putObject(
  //     params.Bucket,
  //     params.Key,
  //     params.Body
  //   );

  //   expect(result).toBeDefined();
  // });

  // it('gets TDI17 file from s3', async () => {
  //   const event = {
  //     type: 'TDI17',
  //     filepath: 'test/tdi17/TDI17.TXT',
  //     outputPath: 'outputs/test/TDI17.json'
  //   };

  //   await handler(event);

  //   const params = {
  //     Bucket: 'bc-pcc-data-files-local',
  //     Key: 'outputs/test/TDI17.json'
  //   };
  //   const file = await service.getContents(params.Bucket, params.Key);
  //   const buffer = file.Body && Buffer.from(file.Body.toString() || '');
  //   fs.createWriteStream(path.join(__dirname, './outputs/TDI17.json')).write(
  //     buffer
  //   );
  // });

  // it('should be defined', async () => {
  //   expect(service).toBeDefined();
  // });

  // it('uploads TDI34 file to parse', async () => {
  //   const params = {
  //     Bucket: 'bc-pcc-data-files-local',
  //     Key: 'test/tdi34/TDI34.TXT',
  //     Body: fs.readFileSync(path.join(__dirname, '../sample-files/TDI34.TXT'))
  //   };

  //   const result = await service.putObject(
  //     params.Bucket,
  //     params.Key,
  //     params.Body
  //   );

  //   expect(result).toBeDefined();
  // });

  // it('gets TDI34 file from s3', async () => {
  //   const event = {
  //     type: 'TDI34',
  //     filepath: 'test/tdi34/TDI34.TXT',
  //     outputPath: 'outputs/test/TDI34.json'
  //   };

  //   await handler(event);

  //   const params = {
  //     Bucket: 'bc-pcc-data-files-local',
  //     Key: 'outputs/test/TDI34.json'
  //   };

  //   const file = await service.getContents(params.Bucket, params.Key);
  //   const buffer = file.Body && Buffer.from(file.Body.toString() || '');
  //   const filejson = JSON.parse(buffer?.toString() ?? '');
  //   const textfile = fs.readFileSync(
  //     path.join(__dirname, '../sample-files/TDI34.TXT')
  //   );
  //   const stringText = textfile.toString().split('\n');

  //   stringText.splice(stringText.length - 1, 1);
  //   stringText.splice(0, 1);

  //   expect(filejson.details.length).toEqual(stringText.length);
  //   expect(Object.keys(filejson.details[0])).toEqual(tdi34Keys);
  //   // 220777441GA2077744108     M ***************91642022110409192022110410   08002E  0000080001985      13V04
  //   expect(
  //     filejson.details[0].rcd_type.toString().split('').length
  //   ).toBeLessThanOrEqual(1);
  //   expect(
  //     filejson.details[0].merchant_no.toString().split('').length
  //   ).toBeLessThanOrEqual(8);
  //   expect(
  //     filejson.details[0].terminal_no.toString().split('').length
  //   ).toBeLessThanOrEqual(12);
  //   expect(
  //     filejson.details[0].fill1.toString().split('').length
  //   ).toBeLessThanOrEqual(5);
  //   expect(
  //     filejson.details[0].card_vendor.toString().split('').length
  //   ).toBeLessThanOrEqual(2);
  //   expect(
  //     filejson.details[0].card_id.toString().split('').length
  //   ).toBeLessThanOrEqual(19);
  //   expect(
  //     filejson.details[0].transaction_date.toString().split('').length
  //   ).toBeLessThanOrEqual(8);
  //   expect(
  //     filejson.details[0].transaction_time.toString().split('').length
  //   ).toBeLessThanOrEqual(4);
  //   expect(
  //     filejson.details[0].transaction_cd.toString().split('').length
  //   ).toBeLessThanOrEqual(2);
  //   expect(
  //     filejson.details[0].fill2.toString().split('').length
  //   ).toBeLessThanOrEqual(3);
  //   expect(
  //     filejson.details[0].approval_cd.toString().split('').length
  //   ).toBeLessThanOrEqual(6);
  //   expect(
  //     filejson.details[0].echo_data_field.toString().split('').length
  //   ).toBeLessThanOrEqual(36);
  //   expect(
  //     filejson.details[0].fill4.toString().split('').length
  //   ).toBeLessThanOrEqual(36);
  //   expect(
  //     filejson.details[0].invoice_no.toString().split('').length
  //   ).toBeLessThanOrEqual(10);
  //   expect(
  //     filejson.details[0].settlement_date.toString().split('').length
  //   ).toBeLessThanOrEqual(8);
  //   expect(
  //     filejson.details[0].fill3.toString().split('').length
  //   ).toBeLessThanOrEqual(2);
  //   expect(
  //     filejson.details[0].transaction_amt.toString().split('').length
  //   ).toBeLessThanOrEqual(9);

  //   fs.createWriteStream(path.join(__dirname, './outputs/TDI34.json')).write(
  //     buffer
  //   );
  // });
});
