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
    console.log(
      fs
        .createWriteStream(path.join(__dirname, './outputs/DDF.json'))
        .write(buffer)
    );
  });

  it('uploads TDI17 file to parse', async () => {
    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'test/tdi17/TDI17.TXT',
      Body: fs.readFileSync(path.join(__dirname, '../sample-files/TDI17.TXT'))
    };

    const result = await service.putObject(
      params.Bucket,
      params.Key,
      params.Body
    );

    expect(result).toBeDefined();
  });

  it('gets TDI17 file from s3', async () => {
    const event = {
      type: 'TDI17',
      filepath: 'test/tdi17/TDI17.TXT',
      outputPath: 'outputs/test/TDI17.json'
    };

    await handler(event);

    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'outputs/test/TDI17.json'
    };
    const file = await service.getContents(params.Bucket, params.Key);
    const buffer = file.Body && Buffer.from(file.Body.toString() || '');
    console.log(
      fs
        .createWriteStream(path.join(__dirname, './outputs/TDI17.json'))
        .write(buffer)
    );
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('uploads TDI34 file to parse', async () => {
    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'test/tdi34/TDI34.TXT',
      Body: fs.readFileSync(path.join(__dirname, '../sample-files/TDI34.TXT'))
    };

    const result = await service.putObject(
      params.Bucket,
      params.Key,
      params.Body
    );

    expect(result).toBeDefined();
  });

  it('gets TDI34 file from s3', async () => {
    const event = {
      type: 'TDI34',
      filepath: 'test/tdi34/TDI34.TXT',
      outputPath: 'outputs/test/TDI34.json'
    };

    await handler(event);

    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'outputs/test/TDI34.json'
    };
    const file = await service.getContents(params.Bucket, params.Key);
    const buffer = file.Body && Buffer.from(file.Body.toString() || '');
    fs.createWriteStream(path.join(__dirname, './outputs/TDI34.json')).write(
      buffer
    );
  });
  //TODO add more tests to verify the content of the output files
});
