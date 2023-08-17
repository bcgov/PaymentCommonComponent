import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../src/logger/logger.module';
import { SnsManagerModule } from '../../../src/sns-manager/sns-manager.module';
import { SnsManagerService } from '../../../src/sns-manager/sns-manager.service';

describe('SnsManagerService', () => {
  let service: SnsManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, SnsManagerModule],
      providers: [SnsManagerService],
    }).compile();

    service = module.get<SnsManagerService>(SnsManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
