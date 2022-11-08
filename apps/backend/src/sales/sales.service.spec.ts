import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from '../common/logger.service';
import { FirehoseService } from '../firehose/firehose.service';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        Logger,
        {
          provide: FirehoseService,
          useValue: jest.fn(),
        }
      ],

    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
