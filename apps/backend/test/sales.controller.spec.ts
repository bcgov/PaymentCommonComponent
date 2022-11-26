import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from '../src/sales/sales.controller';
import { SalesService } from '../src/sales/sales.service';

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
