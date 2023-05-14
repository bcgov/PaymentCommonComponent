import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
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
import { LocationService } from '../../../src/location/location.service';
import { generateLocation } from '../../mocks/const/location_mock';
import { MockData } from '../../mocks/mocks';

describe('POSDepositService', () => {
  let service: PosDepositService;
  let repository: Repository<POSDepositEntity>;
  let posDepositMock: jest.Mocked<POSDepositEntity>;
  let locationService: DeepMocked<LocationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDepositService,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: createMock<Repository<POSDepositEntity>>()
        }
      ]
    })
      .useMocker(createMock)
      .compile();

    service = module.get<PosDepositService>(PosDepositService);
    locationService = module.get(LocationService);
    repository = module.get(getRepositoryToken(POSDepositEntity));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });
  /*eslint-disable */
  describe('findAllUploadedFiles', () => {
    it('should return all previously uploaded pos deposit files', async () => {
      const spy = jest.spyOn(service, 'findAllUploadedFiles');

      await service.findAllUploadedFiles();
      expect(repository.createQueryBuilder).toBeCalledTimes(1);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('save and query POS Deposits', () => {
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
      const spy = jest.spyOn(service, 'savePOSDepositEntities');
      const mockData = new MockData(PaymentMethodClassification.POS);
      const posDepositMocks = mockData.depositsMock as POSDepositEntity[];
      await service.savePOSDepositEntities([...posDeposit, ...posDepositMocks]);
      expect(repository.save).toBeCalledTimes(
        posDeposit.length + posDepositMocks.length
      );
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith([...posDeposit, ...posDepositMocks]);
    });
  });
  describe('findPOSDeposits', () => {
    it('should call find and return an array', async () => {
      const spy = jest.spyOn(service, 'findPOSDeposits');
      const location = generateLocation();
      await service.findPOSDeposits(
        { yesterday: new Date(), today: new Date() },
        Ministries.SBC,
        location
      );
      expect(spy).toBeCalledTimes(1);
      expect(repository.find).toBeCalledTimes(1);
      expect(locationService.getMerchantIdsByLocationId).toBeCalledTimes(1);
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
