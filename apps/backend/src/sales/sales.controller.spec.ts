import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from '../common/logger.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController', () => {
  let controller: SalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [Logger, { provide: SalesService, useValue: jest.fn() }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
