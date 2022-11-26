import { Test, TestingModule } from '@nestjs/testing';
import { FirehoseService } from '../src/firehose/firehose.service';

describe('FirehoseService', () => {
  let service: FirehoseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirehoseService,
        {
          provide: 'AWS_SERVICE_FIREHOSE',
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<FirehoseService>(FirehoseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
