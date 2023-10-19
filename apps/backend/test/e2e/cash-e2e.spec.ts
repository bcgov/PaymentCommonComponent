import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as csv from 'csvtojson';
import { Repository } from 'typeorm';
import fs from 'fs';
import path, { join } from 'path';
import { validationPipeConfig } from '../../src/app.config';
import { AppModule } from '../../src/app.module';
import { BankMerchantId, FileTypes, Ministries } from '../../src/constants';
import { CashDepositService } from '../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../../src/deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../../src/deposits/pos-deposit.service';
import { TDI17Details } from '../../src/flat-files/tdi17/TDI17Details';
import { TDI34Details } from '../../src/flat-files/tdi34/TDI34Details';
import { extractDateFromTXNFileName } from '../../src/lambdas/helpers';
import { parseGarms } from '../../src/lambdas/utils/parseGarms';
import { parseTDI, parseTDIHeader } from '../../src/lambdas/utils/parseTDI';
import {
  MasterLocationEntity,
  LocationEntity,
  MerchantLocationEntity,
  BankLocationEntity,
} from '../../src/location/entities';
import { ILocation } from '../../src/location/interface/location.interface';
import { TransactionEntity } from '../../src/transaction/entities';
import { PaymentMethodEntity } from '../../src/transaction/entities/payment-method.entity';
import { SBCGarmsJson } from '../../src/transaction/interface';
import { TransactionService } from '../../src/transaction/transaction.service';
import { TrimPipe } from '../../src/trim.pipe';

//TODO WIP
describe('Reconciliation Service (e2e)', () => {
  let app: INestApplication;
  let paymentMethodRepo: Repository<PaymentMethodEntity>;
  let ministryLocationRepo: Repository<LocationEntity>;
  let masterLocationRepo: Repository<MasterLocationEntity>;
  let posDepositService: PosDepositService;
  let cashDepositService: CashDepositService;
  let transService: TransactionService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new TrimPipe(),
      new ValidationPipe(validationPipeConfig)
    );
    await app.init();
    cashDepositService = module.get(CashDepositService);
    posDepositService = module.get(PosDepositService);
    transService = module.get(TransactionService);
    masterLocationRepo = module.get('MasterLocationEntityRepository');
    ministryLocationRepo = module.get('LocationEntityRepository');
    paymentMethodRepo = module.get('PaymentMethodEntityRepository');
  });
  it('creates location table', async () => {
    const sbcLocationsMasterDataFile = path.resolve(
      __dirname,
      '../../master_data/locations.csv'
    );
    const sbcLocationMaster = (await csv
      .default()
      .fromFile(sbcLocationsMasterDataFile)) as ILocation[];

    const baseLocationEntities = sbcLocationMaster.map((loc) => {
      return new MasterLocationEntity({ ...loc });
    });

    const baseLocations = await masterLocationRepo.save(baseLocationEntities);

    const locationEntityList = baseLocations
      .filter((itm) => itm.source_id === Ministries.SBC)
      .reduce(
        (
          acc: { [key: string]: Partial<LocationEntity> },
          itm: MasterLocationEntity
        ) => {
          const key = `${itm.location_id}${itm.source_id}`;
          if (!acc[key]) {
            acc[key] = {
              source_id: itm.source_id,
              location_id: itm.location_id,
              program_code: itm.program_code,
              program_desc: itm.program_desc,
              ministry_client: itm.ministry_client,
              resp_code: itm.resp_code,
              service_line_code: itm.service_line_code,
              stob_code: itm.stob_code,
              project_code: itm.project_code,
              banks: [],
              merchants: [],
              description: '',
            };
          }

          itm.merchant_id !== BankMerchantId &&
            !acc[key].merchants?.find(
              (merch) => merch.merchant_id === itm.merchant_id
            ) &&
            acc[key].merchants?.push(
              new MerchantLocationEntity({ merchant_id: itm.merchant_id })
            );

          !acc[key].banks?.find(
            (pt) => pt.pt_location_id === itm.pt_location_id
          ) &&
            acc[key].banks?.push(
              new BankLocationEntity({ pt_location_id: itm.pt_location_id })
            );

          acc[key].description = baseLocations.find(
            (loc) =>
              loc.location_id === itm.location_id && loc.method === 'Bank'
          )!.description;

          return acc;
        },
        {}
      );
    await ministryLocationRepo.save(
      ministryLocationRepo.create(
        Object.values(locationEntityList).map((itm) => new LocationEntity(itm))
      )
    );
  });
  it('creates payment method table', async () => {
    const paymentMethodMasterFile = path.resolve(
      __dirname,
      '../../master_data/payment_method.csv'
    );
    const paymentMethods = (await csv
      .default()
      .fromFile(paymentMethodMasterFile)) as PaymentMethodEntity[];

    const paymentMethodsEntities = paymentMethods.map((pm) => {
      return new PaymentMethodEntity({
        method: pm.method,
        description: pm.description,
        sbc_code: pm.sbc_code,
        classification: pm.classification,
      });
    });

    await paymentMethodRepo.save(paymentMethodsEntities);
  });

  it('parses and inserts cash deposit data', async () => {
    const contents = Buffer.from(
      fs.readFileSync(
        join(__dirname, '../fixtures/PROD_SBC_F08TDI17_20230309.DAT'),
        'utf8'
      )
    ).toString();
    const header = parseTDIHeader(FileTypes.TDI17, contents);
    const parsedTDI17File = parseTDI({
      type: FileTypes.TDI17,
      fileName: 'bcm/PROD_SBC_F08TDI17_20230309.DAT',
      program: 'SBC',
      fileContents: contents,
      header,
    }) as TDI17Details[];
    const entities = parsedTDI17File.map((itm) => new CashDepositEntity(itm));
    await cashDepositService.saveCashDepositEntities(entities);
  }, 12000);

  it('parses inserts pos deposit data', async () => {
    const contents = Buffer.from(
      fs.readFileSync(
        join(__dirname, '../fixtures/PROD_SBC_F08TDI34_20230309.DAT'),
        'utf8'
      )
    ).toString();
    const header = parseTDIHeader(FileTypes.TDI34, contents);
    const parsedTDI34File = parseTDI({
      type: FileTypes.TDI34,
      fileName: 'bcm/PROD_SBC_F08TDI34_20230309.DAT',
      program: 'SBC',
      fileContents: contents,
      header,
    }) as TDI34Details[];
    const tdi34Entities = parsedTDI34File.map(
      (itm) => new POSDepositEntity(itm)
    );

    await posDepositService.savePOSDepositEntities(tdi34Entities);
  });

  it('parses and inserts payment data', async () => {
    const paymentMethods = await paymentMethodRepo.find();
    const locations = await ministryLocationRepo.find();
    const contents = fs.readFileSync(
      join(__dirname, '../fixtures/SBC_SALES_2023_03_08_23_17_53.JSON'),
      'utf8'
    );
    const parsedGarmsFile: TransactionEntity[] = await parseGarms(
      (await JSON.parse(contents)) as SBCGarmsJson[],
      'sbc/SBC_SALES_2023_03_08_23_17_53.JSON',
      paymentMethods,
      extractDateFromTXNFileName('sbc/SBC_SALES_2023_03_08_23_17_53.JSON'),
      locations.filter((itm) => itm.source_id === 'SBC')
    );
    await transService.saveTransactions(parsedGarmsFile);
  }, 12000);
});
