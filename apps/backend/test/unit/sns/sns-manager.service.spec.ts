import { Test, TestingModule } from '@nestjs/testing';
import { SNS } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { SnsManagerModule } from '../../../src/sns-manager/sns-manager.module';
import { SnsManagerService } from '../../../src/sns-manager/sns-manager.service';

describe('SnsManagerService', () => {
  let service: SnsManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SnsManagerModule,
        AwsSdkModule.forRoot({
          defaultServiceOptions: {
            endpoint: 'http://minio:9000',
            region: 'ca-central-1',
            s3ForcePathStyle: true,
          },
          services: [SNS],
        }),
      ],
      providers: [SnsManagerService],
    }).compile();

    service = module.get<SnsManagerService>(SnsManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
