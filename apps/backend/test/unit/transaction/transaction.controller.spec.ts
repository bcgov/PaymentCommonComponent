import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../../../src/logger/logger.module';
import { TransactionController } from '../../../src/transaction/transaction.controller';
import { TransactionService } from '../../../src/transaction/transaction.service';

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      controllers: [TransactionController],
      providers: [Logger, { provide: TransactionService, useValue: jest.fn() }],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
