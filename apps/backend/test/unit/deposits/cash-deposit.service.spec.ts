import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { MatchStatus, MatchStatusAll } from '../../../src/common/const';
import {
  ParseArgsTDI,
  FileTypes,
  Ministries,
  PaymentMethodClassification,
} from '../../../src/constants';
import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../../src/deposits/entities/cash-deposit.entity';
import { TDI17Details } from '../../../src/flat-files';
import { parseTDI, parseTDIHeader } from '../../../src/lambdas/utils/parseTDI';
import { LocationEntity } from '../../../src/location/entities';
import { generateDateRange } from '../../mocks/const/date_range_mock';
import { generateLocation } from '../../mocks/const/location_mock';
import { MockData } from '../../mocks/mocks';
describe('CashDepositService', () => {
  let service: CashDepositService;
  let repository: Repository<CashDepositEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CashDepositService,
        {
          provide: getRepositoryToken(CashDepositEntity),
          useValue: createMock<Repository<CashDepositEntity>>(),
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<CashDepositService>(CashDepositService);
    repository = module.get(getRepositoryToken(CashDepositEntity));
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
    it('should return all previously uploaded cash deposit files', async () => {
      const spy = jest.spyOn(service, 'findAllUploadedFiles');
      await service.findAllUploadedFiles();
      expect(repository.createQueryBuilder).toBeCalledTimes(1);
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('saveCashDepositEntities', () => {
    it('should should parse a flat file, create entities, and call repository.create and repository.save the same number of times as the length of the file being parsed', async () => {
      const testCashFile = fs.readFileSync(
        path.join(__dirname, '../../fixtures/TDI17.TXT')
      );
      const header = parseTDIHeader(FileTypes.TDI17, testCashFile.toString());
      const tdi17Mock: ParseArgsTDI = {
        type: FileTypes.TDI17,
        fileName: 'sbc/PROD_SBC_F08TDI17_20230529.DAT',
        program: 'SBC',
        fileContents: Buffer.from(testCashFile).toString(),
        header,
      };

      const data: TDI17Details[] = [...parseTDI(tdi17Mock)] as TDI17Details[];

      const cashDeposits: CashDepositEntity[] = data.map(
        (itm) => new CashDepositEntity(itm)
      );

      const spy = jest.spyOn(service, 'saveCashDepositEntities');

      await service.saveCashDepositEntities(cashDeposits);

      expect(repository.create).toBeCalledTimes(cashDeposits.length);
      expect(repository.save).toBeCalledTimes(cashDeposits.length);

      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('findCashDepositDatesByLocation', () => {
    it('should call repository.find with the correct query parameters passed in from calling findcashDepositsByDate', async () => {
      const program = Ministries.SBC;
      const depositDate = generateDateRange();
      const location = generateLocation() as unknown as LocationEntity;
      const status = [MatchStatus.PENDING, MatchStatus.IN_PROGRESS];

      jest.spyOn(repository, 'find');

      await service.findCashDepositsByDate(
        program,
        depositDate.maxDate,
        location,
        status
      );

      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          pt_location_id: { location },
          metadata: { program },
          deposit_date: depositDate.maxDate,
          status: In(status),
        },
        order: { deposit_amt_cdn: 'DESC' },
      });
    });

    it('should call repository.find using the default MatchStatusAll if no status is provided when calling findCahsDepositsByDate', async () => {
      const program = Ministries.SBC;
      const depositDate = '2022-01-01';
      const location = generateLocation();

      jest.spyOn(repository, 'find');

      const functionParams = {
        program,
        depositDate,
        location,
      };

      const innerFunctionExpectedStatusParams = In(MatchStatusAll);

      await service.findCashDepositsByDate(
        functionParams.program,
        functionParams.depositDate,
        functionParams.location
      );

      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          pt_location_id: { location },
          metadata: { program },
          deposit_date: depositDate,
          status: innerFunctionExpectedStatusParams,
        },
        order: { deposit_amt_cdn: 'DESC' },
      });
    });
  });

  describe('updateDeposits', () => {
    it('should call updateDeposit once for every item passed in to updateDeposits & it should not call repository.create when updating', async () => {
      jest.spyOn(repository, 'save');

      const data = new MockData(PaymentMethodClassification.CASH);
      const mockCashData = data.depositsMock as CashDepositEntity[];
      console.log(mockCashData);
      const spy = jest.spyOn(service, 'updateDeposits');

      service.updateDeposit = jest.fn();

      const result = await service.updateDeposits(
        mockCashData.map((itm) => ({ ...itm, status: MatchStatus.MATCH }))
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(service.updateDeposit).toHaveBeenCalledTimes(mockCashData.length);

      expect(repository.create).not.toHaveBeenCalled();

      expect(result.length).toEqual(mockCashData.length);
    });
  });

  describe('findCashDepositExceptions', () => {
    it('should call repository.find with the correct params when calling findCashDepositExceptions', async () => {
      const program = Ministries.SBC;

      const location = generateLocation();

      const data = new MockData(PaymentMethodClassification.CASH);
      const dates = data.dateRange;

      jest.spyOn(service, 'findCashDepositExceptions');

      await service.findCashDepositExceptions(dates.minDate, program, location);

      expect(repository.find).toHaveBeenCalledTimes(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          pt_location_id: { location },
          metadata: { program: program },
          deposit_date: LessThanOrEqual(dates.minDate),
          status: MatchStatus.IN_PROGRESS,
        },
      });
    });
  });
});
