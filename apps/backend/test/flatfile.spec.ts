import { Test, TestingModule } from '@nestjs/testing';
import { AWSError } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { GetObjectOutput } from 'aws-sdk/clients/s3';
import { PromiseResult } from 'aws-sdk/lib/request';
import { handler } from '../src/lambdas/parseFlatFile';
import { S3ManagerService } from '../src/s3-manager/s3-manager.service';
import { S3ManagerModule } from '../src/s3-manager/s3-manager.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import * as fs from 'fs';
import { ConsoleLogger } from '@nestjs/common';

describe('Parser (e2e)', () => {
  let service: S3ManagerService;
  let s3: S3ManagerModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // AppModule,
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

  it('uploads file to parse', async () => {
    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'test/ddf/DDF.TXT',
      Body: '../sample-files/DDF.TXT'
    };

    const result = await service.putObject(
      params.Bucket,
      params.Key,
      params.Body
    );

    expect(result).toBeDefined();
  });

  it('gets file from s3', async () => {
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
    console.log(fs.createWriteStream('./DDF.json').write(buffer));
  });
});
