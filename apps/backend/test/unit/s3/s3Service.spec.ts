import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../src/logger/logger.module';
import { S3ManagerModule } from '../../../src/s3-manager/s3-manager.module';
import { S3ManagerService } from '../../../src/s3-manager/s3-manager.service';

describe('Parser (e2e)', () => {
  let service: S3ManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, S3ManagerModule],
      providers: [S3ManagerService],
    }).compile();
    service = module.get<S3ManagerService>(S3ManagerService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });
});
