import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { format } from 'date-fns';
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
import { parseTDI, parseTDIHeader } from '../../../src/lambdas/utils/parseTDI';
import { generateLocation } from '../../mocks/const/location_mock';
import { MockData } from '../../mocks/mocks';

describe('POSDepositService', () => {
  let service: PosDepositService;
  let repository: Repository<POSDepositEntity>;
  let posDepositMock: jest.Mocked<POSDepositEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosDepositService,
        {
          provide: getRepositoryToken(POSDepositEntity),
          useValue: createMock<Repository<POSDepositEntity>>(),
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<PosDepositService>(PosDepositService);
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
      const header = parseTDIHeader(FileTypes.TDI34, testFile.toString());
      const tdi34Mock: ParseArgsTDI = {
        type: FileTypes.TDI34,
        fileName: 'sbc/PROD_SBC_F08TDI34_20230504.DAT',
        program: 'SBC',
        fileContents: Buffer.from(testFile).toString(),
        header,
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
  describe('findPosDeposits', () => {
    it('should call find and return an array', async () => {
      const spy = jest.spyOn(service, 'findPosDeposits');
      const location = generateLocation();
      await service.findPosDeposits(
        {
          minDate: format(new Date(), 'yyyy-MM-dd'),
          maxDate: format(new Date(), 'yyyy-MM-dd'),
        },
        Ministries.SBC,
        location.merchant_ids
      );
      expect(spy).toBeCalledTimes(1);
      expect(repository.find).toBeCalledTimes(1);
    });
  });
  describe('update', () => {
    it('should update a pos deposit', async () => {
      const spy = jest
        .spyOn(service, 'updateDeposits')
        .mockResolvedValue([posDepositMock]);

      expect(service.updateDeposits([posDepositMock])).resolves.toEqual([
        posDepositMock,
      ]);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith([posDepositMock]);
    });
  });
});
