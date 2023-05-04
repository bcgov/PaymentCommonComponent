import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import { ParseArgsTDI, FileTypes, Ministries } from '../../../src/constants';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { TDI17Details } from '../../../src/flat-files';
import { parseTDI } from '../../../src/lambdas/utils/parseTDI';
import { LocationEntity } from '../../../src/location/entities';
import { MockCashData } from '../../mocks/mocks';

describe('CashDepositService', () => {
  let cashDepositService: CashDepositService;
  let cashDepositRepo: Repository<CashDepositEntity>;
  let cashDeposits: CashDepositEntity[];
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CashDepositService,
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            find: jest.fn(),
            save: jest.fn()
          }
        },
        { provide: Logger, useValue: {} }
      ]
    }).compile();

    const mockCashData = new MockCashData();
    cashDeposits = mockCashData.cashDepositsMock;

    cashDepositService = moduleRef.get<CashDepositService>(CashDepositService);
    cashDepositRepo = moduleRef.get<Repository<CashDepositEntity>>(
      getRepositoryToken(CashDepositEntity)
    );
  });

  /*eslint-disable */
  describe('findAllUploadedFiles', () => {
    it('should return all previously uploaded cash deposit files', async () => {
      const result = [{ source_file_name: 'test/TDI17' }];
      const spy = jest
        .spyOn(cashDepositService, 'findAllUploadedFiles')
        .mockImplementation((): any => result);
      expect(await cashDepositService.findAllUploadedFiles()).toEqual(result);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('saveCashDepositEntities', () => {
    it('should create a new cash deposit from the parsed tdi17 details', async () => {
      const testCashFile = fs.readFileSync(
        path.join(__dirname, '../../fixtures/TDI17.TXT')
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
        .spyOn(cashDepositService, 'saveCashDepositEntities')
        .mockResolvedValue(cashDeposit);

      expect(
        cashDepositService.saveCashDepositEntities(cashDeposit)
      ).resolves.toEqual(cashDeposit);
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(cashDeposit);
    });

    it('should throw an exception if the wrong file is used', async () => {
      const testCashFile = fs.readFileSync(
        path.join(__dirname, '../../fixtures/TDI34.TXT')
      );

      const tdi34Mock: ParseArgsTDI = {
        type: FileTypes.TDI34,
        fileName: 'test/TDI34',
        program: 'SBC',
        fileContents: Buffer.from(testCashFile).toString()
      };
      const data: TDI17Details[] = [...parseTDI(tdi34Mock)] as TDI17Details[];
      const cashDeposits: CashDepositEntity[] = data.map(
        (itm) => new CashDepositEntity(itm)
      );
      const spy = jest
        .spyOn(cashDepositService, 'saveCashDepositEntities')
        .mockRejectedValue(testCashFile);

      expect(
        cashDepositService.saveCashDepositEntities(cashDeposits)
      ).rejects.toEqual(testCashFile);
      expect(spy).toBeCalledTimes(1);
      expect(cashDepositService.saveCashDepositEntities).toBeCalledWith(
        cashDeposits
      );
    });
  });

  describe('findCashDepositDatesByLocation', () => {
    describe('findCashDepositsByDate', () => {
      it('should return an array of CashDepositEntity instances matching the given parameters', async () => {
        const program = Ministries.SBC;
        const depositDate = '2022-01-01';
        const location = { pt_location_id: 1 } as LocationEntity;
        const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

        const expectedEntities = [
          { id: 1, deposit_amt_cdn: 100 },
          { id: 2, deposit_amt_cdn: 200 }
        ];

        jest
          .spyOn(cashDepositRepo, 'find')
          .mockResolvedValueOnce(expectedEntities as any);

        const result = await cashDepositService.findCashDepositsByDate(
          program,
          depositDate,
          location,
          status
        );

        expect(result).toEqual(expectedEntities);
        expect(cashDepositRepo.find).toHaveBeenCalledTimes(1);
        expect(cashDepositRepo.find).toHaveBeenCalledWith({
          where: {
            pt_location_id: location.pt_location_id,
            metadata: { program },
            deposit_date: depositDate,
            status: In(status)
          },
          order: { deposit_amt_cdn: 'ASC' }
        });
      });

      it('should return an empty array if no matching CashDepositEntity instances are found', async () => {
        const program = Ministries.SBC;
        const depositDate = '2022-01-01';
        const location = { pt_location_id: 1 } as LocationEntity;
        const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

        jest.spyOn(cashDepositRepo, 'find').mockResolvedValueOnce([]);

        const result = await cashDepositService.findCashDepositsByDate(
          program,
          depositDate,
          location,
          status
        );

        expect(result).toEqual([]);
        expect(cashDepositRepo.find).toHaveBeenCalledTimes(1);
        expect(cashDepositRepo.find).toHaveBeenCalledWith({
          where: {
            pt_location_id: location.pt_location_id,
            metadata: { program },
            deposit_date: depositDate,
            status: In(status)
          },
          order: { deposit_amt_cdn: 'ASC' }
        });
      });

      it('should return an array of CashDepositEntity instances matching the given parameters when status is undefined', async () => {
        const program = Ministries.SBC;
        const depositDate = '2022-01-01';
        const location = { pt_location_id: 1 } as LocationEntity;

        const expectedEntities = [
          { id: 1, deposit_amt_cdn: 100 },
          { id: 2, deposit_amt_cdn: 200 }
        ];

        jest
          .spyOn(cashDepositRepo, 'find')
          .mockResolvedValueOnce(expectedEntities as any);

        const result = await cashDepositService.findCashDepositsByDate(
          program,
          depositDate,
          location
        );

        expect(result).toEqual(expectedEntities);
        expect(cashDepositRepo.find).toHaveBeenCalledTimes(1);
        expect(cashDepositRepo.find).toHaveBeenCalledWith({
          where: {
            pt_location_id: location.pt_location_id,
            metadata: { program },
            deposit_date: depositDate,
            status: In(MatchStatusAll)
          },
          order: { deposit_amt_cdn: 'ASC' }
        });
      });
    });
  });

  describe('updateDeposits', () => {
    it('should update and return an array of CashDepositEntity instances', async () => {
      jest
        .spyOn(cashDepositRepo, 'save')
        .mockResolvedValueOnce(cashDeposits[0] as any);
      jest
        .spyOn(cashDepositRepo, 'save')
        .mockResolvedValueOnce(cashDeposits[1] as any);

      const updatedEntities = await cashDepositService.updateDeposits(
        cashDeposits
      );

      expect([updatedEntities[0], updatedEntities[1]]).toEqual([
        cashDeposits[0],
        cashDeposits[1]
      ]);
    });
  });

  describe('updateDeposit', () => {
    it('should update and return a single CashDepositEntity instance', async () => {
      const expected = cashDeposits[0];
      expected.status = MatchStatus.MATCH;

      jest
        .spyOn(cashDepositRepo, 'save')
        .mockResolvedValueOnce(expected as any);

      const updatedEntity = await cashDepositService.updateDeposit(
        cashDeposits[0]
      );

      expect(updatedEntity).toEqual(expected);
    });
  });

  describe('findCashDepositExceptions', () => {
    it('should return an array of CashDepositEntity instances matching the given parameters', async () => {
      const program = Ministries.SBC;
      const depositDate = '2022-01-01';
      const location = { pt_location_id: 1 } as LocationEntity;

      const expectedEntities = [
        { id: 1, deposit_amt_cdn: 100 },
        { id: 2, deposit_amt_cdn: 200 }
      ];

      jest
        .spyOn(cashDepositRepo, 'find')
        .mockResolvedValueOnce(expectedEntities as any);

      const foundEntities = await cashDepositService.findCashDepositExceptions(
        depositDate,
        program,
        location
      );

      expect(foundEntities).toEqual(expectedEntities);
    });
  });

  describe('findCashDepositsForReport', () => {
    it('should return an array of CashDepositEntity instances matching the given parameters', async () => {
      const program = Ministries.SBC;
      const dateRange = { from_date: '2022-01-01', to_date: '2022-01-31' };
      const location = { pt_location_id: 1 } as LocationEntity;

      const expectedEntities = [
        { id: 1, deposit_amt_cdn: 100 },
        { id: 2, deposit_amt_cdn: 200 }
      ];

      jest
        .spyOn(cashDepositRepo, 'find')
        .mockResolvedValueOnce(expectedEntities as any);

      const foundEntities = await cashDepositService.findCashDepositsForReport(
        location,
        program,
        dateRange
      );

      expect(foundEntities).toEqual(expectedEntities);
    });
  });
});
