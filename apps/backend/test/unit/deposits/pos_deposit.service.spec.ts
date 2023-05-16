import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { MatchStatus } from '../../../src/common/const';
import {
  ParseArgsTDI,
  FileTypes,
  Ministries,
  PaymentMethodClassification,
} from '../../../src/constants';
import { POSDepositEntity } from '../../../src/deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../../../src/deposits/pos-deposit.service';
import { TDI34Details } from '../../../src/flat-files';
import { parseTDI } from '../../../src/lambdas/utils/parseTDI';
import { LocationEntity } from '../../../src/location/entities/master-location-data.entity';
import { LocationService } from '../../../src/location/location.service';
import { generateLocation } from '../../mocks/const/location_mock';
import { MockData } from '../../mocks/mocks';

describe('POSDepositService', () => {
  let service: PosDepositService;
  let repository: Repository<POSDepositEntity>;
  let posDepositMock: POSDepositEntity;
  let locationService: LocationService;

  beforeEach(async () => {
    const mockPOSData = new MockData(PaymentMethodClassification.POS);
    const posDepositsMock = mockPOSData.depositsMock as POSDepositEntity[];
    posDepositMock = posDepositsMock[0];
    jest.resetModules();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDepositService,
        LocationService,
        Logger,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: {
            findOneByOrFail: jest.fn(),
            find: jest.fn().mockResolvedValue(posDepositsMock),
            save: jest.fn().mockReturnValue(posDepositMock),
            create: jest.fn().mockReturnValue(posDepositMock),
            createQueryBuilder: jest
              .fn()
              .mockReturnValue([{ source_file_name: 'test/TDI34' }]),
            delete: jest.fn(),
            where: jest.fn(),
            execute: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: {},
        },
      ],
    }).compile();
    locationService = module.get<LocationService>(LocationService);
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
        fileContents: Buffer.from(testFile).toString(),
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
  describe('findPOSDeposits', () => {
    it('should return an array of POSDepositEntity', async () => {
      const date = '2022-01-01';
      const program = Ministries.SBC;
      const location = generateLocation();

      const status = MatchStatus.PENDING;

      jest
        .spyOn(locationService, 'getMerchantIdsByLocationId')
        .mockResolvedValue([location.merchant_id]);

      const expectedPOSDeposits = [
        new POSDepositEntity(),
        new POSDepositEntity(),
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(expectedPOSDeposits);

      const result = await service.findPOSDeposits(
        date,
        program,
        location,
        status
      );

      expect(locationService.getMerchantIdsByLocationId).toHaveBeenCalledWith(
        location.location_id
      );
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          transaction_date: date,
          metadata: {
            program: program,
          },
          status: status,
          merchant_id: In([location.merchant_id]),
        },
        relations: {
          payment_method: true,
        },
        order: {
          transaction_amt: 'ASC',
          payment_method: { method: 'ASC' },
          transaction_time: 'ASC',
        },
      });
      expect(result).toEqual(expectedPOSDeposits);
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
