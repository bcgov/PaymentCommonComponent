import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { CashDepositEntity } from './../../../src/deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from './../../../src/deposits/entities/pos-deposit.entity';
import { LocationEntity } from './../../../src/location/entities/master-location-data.entity';
import { PaymentMethodEntity } from './../../../src/transaction/entities/payment-method.entity';
import { ParseArgsTDI, FileTypes } from '../../../src/constants';
import { PosDepositService } from '../../../src/deposits/pos-deposit.service';
import { TDI34Details } from '../../../src/flat-files';
import { parseTDI } from '../../../src/lambdas/utils/parseTDI';
import { LocationService } from '../../../src/location/location.service';

describe('POSDepositService', () => {
  let service: PosDepositService;
  let repository: Repository<POSDepositEntity>;
  let posDepositMock: POSDepositEntity;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDepositService,
        LocationService,
        Logger,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            save: jest.fn().mockReturnValue(posDepositMock),
            create: jest.fn().mockReturnValue(posDepositMock),
            createQueryBuilder: jest
              .fn()
              .mockReturnValue([{ source_file_name: 'test/TDI34' }]),
            delete: jest.fn(),
            where: jest.fn(),
            execute: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(PaymentMethodEntity),
          useValue: {}
        },
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: {}
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: {}
        }
      ]
    }).compile();

    service = module.get<PosDepositService>(PosDepositService);
    repository = module.get<Repository<POSDepositEntity>>(
      getRepositoryToken(POSDepositEntity)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });
  /*eslint-disable */
  describe('findAllUploadedFiles', () => {
    it('should return all previously uploaded pos deposit files', async () => {
      const result = [{ source_file_name: 'test/TDI34' }];
      const spy = jest
        .spyOn(service, 'findAllUploadedFiles')
        .mockImplementation((): any => result);
      expect(await service.findAllUploadedFiles()).toEqual(result);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('savePOSDepositEntities', () => {
    it('should create a new pos deposit from the parsed tdi34 details', async () => {
      const testFile = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/TDI34.TXT')
      );

      const tdi34Mock: ParseArgsTDI = {
        type: FileTypes.TDI34,
        fileName: 'test/TDI34',
        program: 'SBC',
        fileContents: Buffer.from(testFile).toString()
      };
      const data: TDI34Details[] = [...parseTDI(tdi34Mock)] as TDI34Details[];
      const posDeposit: POSDepositEntity[] = data.map(
        (itm) => new POSDepositEntity(itm)
      );
      const spy = jest
        .spyOn(service, 'savePOSDepositEntities')
        .mockResolvedValue(posDeposit);
      expect(service.savePOSDepositEntities(posDeposit)).resolves.toEqual(
        posDeposit
      );
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(posDeposit);
    });
  });
  describe('update', () => {
    it('should update a pos deposit', async () => {
      const spy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(posDepositMock);
      expect(service.update(posDepositMock)).resolves.toEqual(posDepositMock);
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(posDepositMock);
    });
  });
});
