import { Test, TestingModule } from '@nestjs/testing';
import { S3 } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { LoggerModule } from '../../../src/logger/logger.module';
import { S3ManagerModule } from '../../../src/s3-manager/s3-manager.module';
import { S3ManagerService } from '../../../src/s3-manager/s3-manager.service';

describe('Parser (e2e)', () => {
  let service: S3ManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule,
        S3ManagerModule,
        AwsSdkModule.forRoot({
          defaultServiceOptions: {
            endpoint: 'http://minio:9000',
            region: 'ca-central-1',
            s3ForcePathStyle: true,
          },
          services: [S3],
        }),
      ],
      providers: [S3ManagerService],
    }).compile();
    service = module.get<S3ManagerService>(S3ManagerService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });
});
