import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as csv from 'csvtojson';
import { Repository } from 'typeorm';
import fs from 'fs';
import path, { join } from 'path';
import { validationPipeConfig } from '../../src/app.config';
import { AppModule } from '../../src/app.module';
import { FileTypes } from '../../src/constants';
import { CashDepositService } from '../../src/deposits/cash-deposit.service';
import { CashDepositEntity } from '../../src/deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../../src/deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../../src/deposits/pos-deposit.service';
import { TDI17Details } from '../../src/flat-files/tdi17/TDI17Details';
import { TDI34Details } from '../../src/flat-files/tdi34/TDI34Details';
import { extractDateFromTXNFileName } from '../../src/lambdas/helpers';
import { parseGarms } from '../../src/lambdas/utils/parseGarms';
import { parseTDI, parseTDIHeader } from '../../src/lambdas/utils/parseTDI';
import { MasterLocationEntity } from '../../src/location/entities';
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
  let locationRepo: Repository<MasterLocationEntity>;
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
    locationRepo = module.get('MasterLocationEntityRepository');
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

    const locationEntities = sbcLocationMaster.map((loc) => ({
      ...loc,
    }));

    await locationRepo.save(locationEntities);
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
    const contents = fs.readFileSync(
      join(__dirname, '../fixtures/SBC_SALES_2023_03_08_23_17_53.JSON'),
      'utf8'
    );
    const parsedGarmsFile: TransactionEntity[] = await parseGarms(
      (await JSON.parse(contents)) as SBCGarmsJson[],
      'sbc/SBC_SALES_2023_03_08_23_17_53.JSON',
      paymentMethods,
      extractDateFromTXNFileName('sbc/SBC_SALES_2023_03_08_23_17_53.JSON')
    );
    await transService.saveTransactions(parsedGarmsFile);
  }, 12000);
});
