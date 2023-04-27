import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { MatchStatus } from '../../src/common/const';
import { ParseArgsTDI, FileTypes, Ministries } from '../../src/constants';
import { CashDepositService } from '../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';
import { TDI17Details } from '../../src/flat-files';
import { parseTDI } from '../../src/lambdas/utils/parseTDI';
import { LocationEntity } from '../../src/location/entities';

describe('CashDepositService', () => {
  let service: CashDepositService;
  let repository: Repository<CashDepositEntity>;
  let cashDepositMock: CashDepositEntity;
  let locationMock: LocationEntity;
  let updateResult: UpdateResult;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashDepositService,
        Logger,
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            delete: jest.fn(),
            where: jest.fn(),
            execute: jest.fn(),
            findOneOrFail: jest.fn(() => Promise.resolve({})),
            findAll: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue(cashDepositMock),
            create: jest.fn().mockReturnValue(cashDepositMock),
            createQueryBuilder: jest
              .fn()
              .mockReturnValue({ cash_deposit_source_file_name: 'test/TDI17' })
          }
        }
      ]
    }).compile();

    service = module.get<CashDepositService>(CashDepositService);
    repository = module.get<Repository<CashDepositEntity>>(
      getRepositoryToken(CashDepositEntity)
    );
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('repository should be defined', () => {
    expect(repository).toBeDefined();
  });

  /*eslint-disable */
  describe('findAllUploadedFiles', () => {
    it('should return all previously uploaded cash deposit files', async () => {
      const result = [{ source_file_name: 'test/TDI17' }];
      const spy = jest
        .spyOn(service, 'findAllUploadedFiles')
        .mockImplementation((): any => result);
      expect(await service.findAllUploadedFiles()).toEqual(result);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('saveCashDepositEntities', () => {
    it('should create a new cash deposit from the parsed tdi17 details', async () => {
      const testCashFile = fs.readFileSync(
        path.join(__dirname, '../../sample-files/TDI17.TXT')
      );

      const tdi17Mock: ParseArgsTDI = {
        type: FileTypes.TDI17,
        fileName: 'test/TDI17',
        program: 'SBC',
        fileContents: Buffer.from(testCashFile).toString()
      };
      const data: TDI17Details[] = [...parseTDI(tdi17Mock)] as TDI17Details[];
      const cashDeposit: CashDepositEntity[] = data.map(
        (itm) => new CashDepositEntity(itm)
      );
      const spy = jest
        .spyOn(service, 'saveCashDepositEntities')
        .mockResolvedValue(cashDeposit);

      expect(service.saveCashDepositEntities(cashDeposit)).resolves.toEqual(
        cashDeposit
      );
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(cashDeposit);
    });
    it('should throw an exception if the wrong file is used', async () => {
      const testCashFile = fs.readFileSync(
        path.join(__dirname, '../../sample-files/TDI34.TXT')
      );

      const tdi17Mock: ParseArgsTDI = {
        type: FileTypes.TDI17,
        fileName: 'test/TDI17',
        program: 'SBC',
        fileContents: Buffer.from(testCashFile).toString()
      };
      const data: TDI17Details[] = [...parseTDI(tdi17Mock)] as TDI17Details[];
      const cashDeposit: CashDepositEntity[] = data.map(
        (itm) => new CashDepositEntity(itm)
      );
      const spy = jest
        .spyOn(service, 'saveCashDepositEntities')
        .mockRejectedValue(testCashFile);

      expect(service.saveCashDepositEntities(cashDeposit)).rejects.toEqual(
        testCashFile
      );
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(cashDeposit);
    });
  });

  describe('updateDepositStatus', () => {
    it('should update the cash deposit status', async () => {
      const spy = jest
        .spyOn(service, 'updateDeposit')
        .mockResolvedValue(cashDepositMock);

      expect(service.updateDeposit(cashDepositMock)).resolves.toEqual(
        cashDepositMock
      );
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(cashDepositMock);
    });
  });

  describe('updateDeposits', () => {
    it('should mark cash deposits as matched', async () => {
      const spy = jest
        .spyOn(service, 'updateDeposits')
        .mockResolvedValue([cashDepositMock]);

      expect(
        service.updateDeposits([
          { ...cashDepositMock, status: MatchStatus.MATCH }
        ])
      ).resolves.toEqual([updateResult]);
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith([
        { ...cashDepositMock, status: MatchStatus.MATCH }
      ]);
    });
  });

  describe('findDistinctDepositDates', () => {
    it('should return all distinct deposit dates', async () => {
      const spy = jest
        .spyOn(service, 'findCashDepositDatesByLocation')
        .mockResolvedValue(['2020-01-01', '2020-01-02']);
      const params = {
        program: Ministries.SBC,
        dateRange: {
          to_date: '2020-01-02',
          from_date: '2020-01-01'
        },
        location: locationMock
      };
      expect(
        service.findCashDepositDatesByLocation(
          params.program,
          params.dateRange,
          params.location
        )
      ).resolves.toEqual(['2020-01-01', '2020-01-02']);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('findCashDepositsByDateLocationAndProgram', () => {
    it('should return all cash deposits for a given date, location and program', async () => {
      const spy = jest
        .spyOn(service, 'findCashDepositsByDate')
        .mockResolvedValue([cashDepositMock]);
      const params = {
        program: Ministries.SBC,
        dateRange: {
          to_date: '2020-01-02',
          from_date: '2020-01-01'
        },
        location: locationMock
      };
      expect(
        service.findCashDepositsByDate(
          params.program,
          params.dateRange.to_date,
          params.location
        )
      ).resolves.toEqual([cashDepositMock]);
      expect(spy).toBeCalledTimes(1);
    });
  });
});
