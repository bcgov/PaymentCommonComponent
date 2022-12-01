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
      Key: 'test/test/TEST.TXT',
      Body: fs.readFileSync(path.join(__dirname, '../sample-files/test.TXT'))
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
      filepath: 'test/test/TEST.TXT',
      outputPath: 'outputs/test/TEST.json'
    };

    await handler(event);

    const params = {
      Bucket: 'bc-pcc-data-files-local',
      Key: 'outputs/test/TEST.json'
    };
    const file = await service.getContents(params.Bucket, params.Key);
    const buffer = file.Body && Buffer.from(file.Body.toString() || '');
    fs.createWriteStream(path.join(__dirname, './outputs/TEST.json')).write(
      buffer
    );
  });
});
