import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { FileTypes } from '../../../src/constants';
import { FileIngestionRulesEntity } from '../../../src/parse/entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from '../../../src/parse/entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from '../../../src/parse/entities/program-daily-upload.entity';
import { ParseService } from '../../../src/parse/parse.service';
import { PaymentMethodService } from '../../../src/transaction/payment-method.service';
import { FileIngestionRulesMock } from '../../mocks/classes/file_ingestion_rules_mock';
import { FileUploadedMock } from '../../mocks/classes/file_upload_mock';

describe('ParseService', () => {
  let service: ParseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseService,
        {
          provide: PaymentMethodService,
          useValue: createMock<PaymentMethodService>(),
        },
        {
          provide: Logger,
          useValue: createMock<Logger>(),
        },
        {
          provide: getRepositoryToken(FileIngestionRulesEntity),
          useValue: createMock<Repository<FileIngestionRulesEntity>>(),
        },
        {
          provide: getRepositoryToken(ProgramDailyUploadEntity),
          useValue: createMock<Repository<ProgramDailyUploadEntity>>(),
        },
        {
          provide: getRepositoryToken(FileUploadedEntity),
          useValue: createMock<Repository<FileUploadedEntity>>(),
        },
      ],
    }).compile();

    service = module.get<ParseService>(ParseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determines whether a daily upload is successful', () => {
    it('should be successful if all files are present', () => {
      const rule = new FileIngestionRulesMock(
        'SBC',
        'bcm/PROD_SBC_F08TDI17_20230309.DAT',
        'bcm/PROD_SBC_F08TDI34_20230309.DAT',
        'sbc/SBC_SALES_2023_03_08_23_17_53.JSON'
      );
      const tdi17 = new FileUploadedMock(
        FileTypes.TDI17,
        'bcm/PROD_SBC_F08TDI17_20230309.DAT'
      );
      const tdi34 = new FileUploadedMock(
        FileTypes.TDI34,
        'bcm/PROD_SBC_F08TDI34_20230309.DAT'
      );
      const sales = new FileUploadedMock(
        FileTypes.SBC_SALES,
        'sbc/SBC_SALES_2023_03_08_23_17_53.JSON'
      );
      const dailySuccess = service.determineDailySuccess(rule, [
        tdi17,
        tdi34,
        sales,
      ]);
      expect(dailySuccess.success).toBe(true);
    });

    it('should be successful if all required files are present - not necessarily all 3', () => {
      const rule = new FileIngestionRulesMock(
        'SBC',
        'bcm/PROD_SBC_F08TDI17_20230309.DAT',
        'bcm/PROD_SBC_F08TDI34_20230309.DAT',
        undefined
      );
      const tdi17 = new FileUploadedMock(
        FileTypes.TDI17,
        'bcm/PROD_SBC_F08TDI17_20230309.DAT'
      );
      const tdi34 = new FileUploadedMock(
        FileTypes.TDI34,
        'bcm/PROD_SBC_F08TDI34_20230309.DAT'
      );
      const dailySuccess = service.determineDailySuccess(rule, [tdi17, tdi34]);
      expect(dailySuccess.success).toBe(true);
    });

    it('should fail if one or more of the required files are not present', () => {
      const rule = new FileIngestionRulesMock(
        'SBC',
        'bcm/PROD_SBC_F08TDI17_20230309.DAT',
        'bcm/PROD_SBC_F08TDI34_20230309.DAT',
        undefined
      );
      const tdi17 = new FileUploadedMock(
        FileTypes.TDI17,
        'bcm/PROD_SBC_F08TDI17_20230309.DAT'
      );
      const dailySuccess = service.determineDailySuccess(rule, [tdi17]);
      expect(dailySuccess.success).toBe(false);
    });
  });

  describe('parsers should throw errors when necessary', () => {
    it('should parse garms transaction json files and pass validation if necessary fields are present', async () => {
      const transactionFile = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/garms.json')
      );
      expect(
        (
          await service.parseGarmsFile(
            transactionFile.toString(),
            'sbc/SBC_SALES_2023_03_08_23_17_53.JSON'
          )
        )[0].total_transaction_amount
      ).toEqual(100);
    });

    it('should parse garms transaction json files and not pass validation if the dto is not met', async () => {
      const transactionFile = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/garms.json')
      );
      expect(
        service.parseGarmsFile(
          transactionFile.toString(),
          'sbc/SBC_SALES_2023_03_08_23_17_53.JSON'
        )
      ).rejects.toThrow();
    });

    it('should parse tdi17 dat files and pass validation if necessary fields are present', async () => {
      const tdi17File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/TDI17.TXT')
      );
      expect(
        (
          await service.parseTDICashFile(
            'bcm/PROD_SBC_F08TDI17_20230309.DAT',
            'SBC',
            tdi17File
          )
        )[0].deposit_amt_curr
      ).toEqual(558.31);
    });

    it('should parse tdi17 dat files and not pass validation if the dto is not met', async () => {
      const tdi17File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/TDI17.TXT')
      );
      expect(
        service.parseTDICashFile(
          'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          'SBC',
          tdi17File
        )
      ).rejects.toThrow();
    });

    it('should parse tdi17 dat files and not pass validation if the footer is mismatched with the number of records', async () => {
      const tdi17File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/TDI17.TXT')
      );
      const originalTrailer = '70000180000008000005';
      const wrongTotalTrailer = '70000180000008000010';
      const wrongNumberTrailer = '70000190000008000005';
      const fileContents = Buffer.from(tdi17File.toString() || '').toString();
      const lines = fileContents.split('\n').filter((l: string) => l);
      const footer = lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongTotal = footer.replace(
        originalTrailer,
        wrongTotalTrailer
      );
      lines.push(newFooterWrongTotal);
      expect(
        service.parseTDICashFile(
          'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          'SBC',
          Buffer.from(lines.join('\n'))
        )
      ).rejects.toThrow();

      lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongNumber = footer.replace(
        originalTrailer,
        wrongNumberTrailer
      );
      lines.push(newFooterWrongNumber);
      expect(
        service.parseTDICashFile(
          'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          'SBC',
          Buffer.from(lines.join('\n'))
        )
      ).rejects.toThrow();
    });

    it('should parse tdi34 dat files and pass validation if necessary fields are present', async () => {
      const tdi34File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/TDI34.TXT')
      );
      expect(
        (
          await service.parseTDICardsFile(
            'bcm/PROD_SBC_F08TDI34_20230309.DAT',
            'SBC',
            tdi34File
          )
        )[0].transaction_amt
      ).toEqual(17);
    });

    it('should parse tdi34 dat files and not pass validation if the dto is not met', async () => {
      const tdi34File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/TDI34.TXT')
      );
      expect(
        service.parseTDICardsFile(
          'bcm/PROD_SBC_F08TDI34_20230309.DAT',
          'SBC',
          tdi34File
        )
      ).rejects.toThrow();
    });

    it('should parse tdi34 dat files and not pass validation if the footer is mismatched with the number of records', async () => {
      const tdi34File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/TDI34.TXT')
      );
      const originalTrailer = '7  0017     00129100';
      const wrongTotalTrailer = '7  0017     00134100';
      const wrongNumberTrailer = '7  0019     00129100';
      const fileContents = Buffer.from(tdi34File.toString() || '').toString();
      const lines = fileContents.split('\n').filter((l: string) => l);
      const footer = lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongTotal = footer.replace(
        originalTrailer,
        wrongTotalTrailer
      );
      lines.push(newFooterWrongTotal);
      expect(
        service.parseTDICashFile(
          'bcm/PROD_SBC_F08TD17_20230309.DAT',
          'SBC',
          Buffer.from(lines.join('\n'))
        )
      ).rejects.toThrow();

      lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongNumber = footer.replace(
        originalTrailer,
        wrongNumberTrailer
      );
      lines.push(newFooterWrongNumber);
      expect(
        service.parseTDICashFile(
          'bcm/PROD_SBC_F08TD17_20230309.DAT',
          'SBC',
          Buffer.from(lines.join('\n'))
        )
      ).rejects.toThrow();
    });
  });
});
