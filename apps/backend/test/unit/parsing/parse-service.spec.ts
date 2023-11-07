import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { FileTypes, Ministries } from '../../../src/constants';

import { CashDepositService } from '../../../src/deposits/cash-deposit.service';
import { PosDepositService } from '../../../src/deposits/pos-deposit.service';
import { LocationService } from '../../../src/location/location.service';
import { LoggerModule } from '../../../src/logger/logger.module';
import { FileIngestionRulesEntity } from '../../../src/notification/entities/file-ingestion-rules.entity';
import { ProgramDailyUploadEntity } from '../../../src/notification/entities/program-daily-upload.entity';
import { MailService } from '../../../src/notification/mail.service';
import { NotificationService } from '../../../src/notification/notification.service';
import { FileUploadedEntity } from '../../../src/parse/entities/file-uploaded.entity';
import { ProgramRequiredFileEntity } from '../../../src/parse/entities/program-required-file.entity';
import { ParseService } from '../../../src/parse/parse.service';
import { UploadService } from '../../../src/parse/upload.service';
import { S3ManagerService } from '../../../src/s3-manager/s3-manager.service';
import { SnsManagerService } from '../../../src/sns-manager/sns-manager.service';
import { PaymentMethodService } from '../../../src/transaction/payment-method.service';
import { PaymentService } from '../../../src/transaction/payment.service';
import { TransactionService } from '../../../src/transaction/transaction.service';
import { FileIngestionRulesMock } from '../../mocks/classes/file_ingestion_rules_mock';
import { FileUploadedMock } from '../../mocks/classes/file_upload_mock';
import { locations } from '../../mocks/const/locations';

describe('ParseService', () => {
  let service: ParseService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ParseService,
        NotificationService,
        {
          provide: S3ManagerService,
          useValue: createMock<S3ManagerService>(),
        },
        {
          provide: SnsManagerService,
          useValue: createMock<SnsManagerService>(),
        },
        {
          provide: PaymentMethodService,
          useValue: createMock<PaymentMethodService>(),
        },
        {
          provide: PaymentService,
          useValue: createMock<PaymentService>(),
        },
        {
          provide: PosDepositService,
          useValue: createMock<PosDepositService>(),
        },
        {
          provide: CashDepositService,
          useValue: createMock<CashDepositService>(),
        },
        {
          provide: TransactionService,
          useValue: createMock<TransactionService>(),
        },
        {
          provide: MailService,
          useValue: createMock<MailService>(),
        },
        {
          provide: LocationService,
          useValue: createMock<LocationService>(),
        },
        {
          provide: UploadService,
          useValue: createMock<UploadService>(),
        },
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
        {
          provide: getRepositoryToken(ProgramRequiredFileEntity),
          useValue: createMock<Repository<ProgramRequiredFileEntity>>(),
        },
      ],
    }).compile();

    service = module.get<ParseService>(ParseService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determines whether a daily upload is successful', () => {
    it('should be successful if all files are present', () => {
      const rule = new FileIngestionRulesMock('SBC');
      rule.assignRequiredFile('F08TDI17', FileTypes.TDI17);
      rule.assignRequiredFile('F08TDI34', FileTypes.TDI34);
      rule.assignRequiredFile('SBC_SALES', FileTypes.SBC_SALES);
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

      const missingFiles = notificationService.findMissingDailyFiles(rule, [
        tdi17,
        tdi34,
        sales,
      ]);

      expect(missingFiles.length).toBe(0);
    });

    it('should be successful if all required files are present - not necessarily all 3', () => {
      const rule = new FileIngestionRulesMock('SBC');
      rule.assignRequiredFile('F08TDI17', FileTypes.TDI17);
      rule.assignRequiredFile('F08TDI34', FileTypes.TDI34);
      const tdi17 = new FileUploadedMock(
        FileTypes.TDI17,
        'bcm/PROD_SBC_F08TDI17_20230309.DAT'
      );
      const tdi34 = new FileUploadedMock(
        FileTypes.TDI34,
        'bcm/PROD_SBC_F08TDI34_20230309.DAT'
      );
      const missingFiles = notificationService.findMissingDailyFiles(rule, [
        tdi17,
        tdi34,
      ]);
      expect(missingFiles.length).toBe(0);
    });

    it('should fail if one or more of the required files are not present', () => {
      const rule = new FileIngestionRulesMock('SBC');

      rule.assignRequiredFile('F08TDI17', FileTypes.TDI17);
      rule.assignRequiredFile('F08TDI34', FileTypes.TDI34);
      rule.assignRequiredFile('SBC_SALES', FileTypes.SBC_SALES);
      const tdi17 = new FileUploadedMock(
        FileTypes.TDI17,
        'bcm/PROD_SBC_F08TDI17_20230309.DAT'
      );
      const missingFiles = notificationService.findMissingDailyFiles(rule, [
        tdi17,
      ]);
      const failed = missingFiles.length > 0;
      expect(failed).toBe(true);
    });
  });

  describe('parsers should throw errors when necessary', () => {
    it('should parse garms transaction json files and pass validation if necessary fields are present', async () => {
      const transactionFile = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/garms.json')
      );

      const txns = await service.parseAndValidateSBCGarms(locations, {
        contents: transactionFile,
        filename: 'sbc/SBC_SALES_2023_03_08_23_17_53.JSON',
        fileType: FileTypes.SBC_SALES,
        programRule: new FileIngestionRulesMock('SBC'),
      });

      const testValue = txns[0].total_transaction_amount;
      console.log(testValue, 'TEST VALUE');
      expect(testValue).toEqual(100);
    });

    it('should parse garms transaction json files and not pass validation if the dto is not met', async () => {
      const transactionFile = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/garms.json')
      );
      expect(
        service.parseAndValidateSBCGarms(locations, {
          contents: transactionFile,
          filename: 'sbc/SBC_SALES_2023_03_08_23_17_53.JSON',
          fileType: FileTypes.SBC_SALES,
          programRule: new FileIngestionRulesMock('SBC'),
        })
      ).rejects.toThrow();
    });

    // it('should parse tdi17 dat files and pass validation if necessary fields are present', async () => {
    //   const tdi17File = fs.readFileSync(
    //     path.join(__dirname, '../../../sample-files/TDI17.TXT')
    //   );
    //   const deposits = await service.parseAndValidateTDICashFile(
    //     locations,
    //     Ministries.SBC,
    //     {
    //       contents: tdi17File,
    //       filename: 'bcm/PROD_SBC_F08TDI17_20230309.DAT',
    //       fileType: FileTypes.TDI17,
    //       programRule: new FileIngestionRulesMock('SBC'),
    //     }
    //   );
    //   const testValue = deposits[0].deposit_amt_curr;
    //   expect(testValue).toEqual(558.31);
    // });

    it('should parse tdi17 dat files and not pass validation if the dto is not met', async () => {
      const tdi17File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/TDI17.TXT')
      );
      expect(
        service.parseAndValidateTDICashFile(locations, Ministries.SBC, {
          contents: tdi17File,
          filename: 'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          fileType: FileTypes.TDI17,
          programRule: new FileIngestionRulesMock('SBC'),
        })
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
        service.parseAndValidateTDICashFile(locations, Ministries.SBC, {
          contents: Buffer.from(lines.join('\n')),
          filename: 'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          fileType: FileTypes.TDI17,
          programRule: new FileIngestionRulesMock('SBC'),
        })
      ).rejects.toThrow();

      lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongNumber = footer.replace(
        originalTrailer,
        wrongNumberTrailer
      );
      lines.push(newFooterWrongNumber);
      expect(
        service.parseAndValidateTDICashFile(locations, Ministries.SBC, {
          filename: 'bcm/PROD_SBC_F08TDI17_20230309.DAT',
          contents: Buffer.from(lines.join('\n')),
          fileType: FileTypes.TDI17,
          programRule: new FileIngestionRulesMock('SBC'),
        })
      ).rejects.toThrow();
    });

    // it('should parse tdi34 dat files and pass validation if necessary fields are present', async () => {
    //   const tdi34File = fs.readFileSync(
    //     path.join(__dirname, '../../../sample-files/TDI34.TXT')
    //   );
    //   const entities = await service.parseAndValidateTDICardsFile(
    //     locations,
    //     Ministries.SBC,
    //     {
    //       filename: 'bcm/PROD_SBC_F08TD34_20230309.DAT',
    //       contents: tdi34File,
    //       fileType: FileTypes.TDI34,
    //       programRule: new FileIngestionRulesMock('SBC'),
    //     }
    //   );
    //   console.log(entities)
    //   const testValue = entities[0].transaction_amt;
    //   expect(testValue).toEqual(17);
    // });

    it('should parse tdi34 dat files and not pass validation if the dto is not met', async () => {
      const tdi34File = fs.readFileSync(
        path.join(__dirname, '../../../sample-files/invalid-files/TDI34.TXT')
      );
      expect(
        service.parseAndValidateTDICardsFile(locations, Ministries.SBC, {
          filename: 'bcm/PROD_SBC_F08TDI34_20230309.DAT',
          contents: tdi34File,
          fileType: FileTypes.TDI34,
          programRule: new FileIngestionRulesMock('SBC'),
        })
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
        service.parseAndValidateTDICashFile(locations, Ministries.SBC, {
          filename: 'bcm/PROD_SBC_F08TD17_20230309.DAT',
          contents: Buffer.from(lines.join('\n')),
          fileType: FileTypes.TDI17,
          programRule: new FileIngestionRulesMock('SBC'),
        })
      ).rejects.toThrow();

      lines.splice(lines.length - 1, 1)[0];
      const newFooterWrongNumber = footer.replace(
        originalTrailer,
        wrongNumberTrailer
      );
      lines.push(newFooterWrongNumber);
      expect(
        service.parseAndValidateTDICashFile(locations, Ministries.SBC, {
          filename: 'bcm/PROD_SBC_F08TD17_20230309.DAT',
          contents: Buffer.from(lines.join('\n')),
          fileType: FileTypes.TDI17,
          programRule: new FileIngestionRulesMock('SBC'),
        })
      ).rejects.toThrow();
    });
  });
});
