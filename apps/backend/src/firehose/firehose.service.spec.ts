import { Test, TestingModule } from '@nestjs/testing';
import { FirehoseService } from './firehose.service';

describe('FirehoseService', () => {
  let service: FirehoseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirehoseService],
    }).compile();

    service = module.get<FirehoseService>(FirehoseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
