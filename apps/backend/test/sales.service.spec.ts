import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SalesService } from '../src/sales/sales.service';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesService, Logger]
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
