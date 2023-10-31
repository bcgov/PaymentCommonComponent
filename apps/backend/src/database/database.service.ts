import { GetObjectCommandInput } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import * as csv from 'csvtojson';
import { masterData } from './const';
import { FileTypes, Ministries } from '../constants';
import { CashDepositService } from '../deposits/cash-deposit.service';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { PosDepositService } from '../deposits/pos-deposit.service';
import {
  MinistryLocationEntity,
  MasterLocationEntity,
} from '../location/entities';
import { LocationService } from '../location/location.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { PaymentMethodEntity } from '../transaction/entities';
import { PaymentMethodService } from '../transaction/payment-method.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(S3ManagerService) private readonly s3Service: S3ManagerService,
    @Inject(LocationService) private readonly locationService: LocationService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService,
    @Inject(TransactionService)
    private readonly transactionService: TransactionService,
    @Inject(PosDepositService)
    private readonly posDepositService: PosDepositService,
    @Inject(CashDepositService)
    private readonly cashDepositService: CashDepositService
  ) {}
  /**
   * We rely on "master" data to join our txn/deposit table in order to match
   */
  async seedMasterData() {
    const locations: MasterLocationEntity[] =
      await this.locationService.findAll();

    const paymentMethods: PaymentMethodEntity[] =
      await this.paymentMethodService.getPaymentMethods();

    const rules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();

    if (rules.length === 0) {
      await this.seedFileIngestionRules();
    }

    if (locations.length === 0) {
      await this.seedLocations();
    }
    if (paymentMethods.length === 0) {
      await this.seedPaymentMethods();
    }

    const programRules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();
    // Get the list of current clients from the programRules table
    for (const rule of programRules) {
      // check each client to see if the location table has been seeded
      const ministryLocations =
        await this.locationService.findMinistryLocations(
          Ministries[rule.program as unknown as keyof typeof Ministries]
        );
      // if not, seed the location table
      if (ministryLocations.length === 0) {
        await this.seedMinistryLocations(
          Ministries[rule.program as keyof typeof Ministries]
        );
        break;
      }
    }

    const ministryLocations: MinistryLocationEntity[] =
      await this.locationService.findAllMinistryLocations();
    const transactionsWithNullLocation =
      await this.transactionService.findWithNullLocation();
    const posDepositWithNullLocation =
      await this.posDepositService.findWithNullLocation();
    const cashDepositWithnullLocation =
      await this.cashDepositService.findWithNullLocation();

    if (transactionsWithNullLocation.length > 0) {
      const txns = transactionsWithNullLocation.map((txn) => {
        const location = ministryLocations.find(
          (loc) =>
            loc.source_id === txn.source_id &&
            loc.location_id === txn.location_id
        )!;
        return { ...txn, location };
      });
      await this.transactionService.saveTransactions(txns);
    }

    if (posDepositWithNullLocation.length > 0) {
      const merchants = ministryLocations.flatMap((itm) => itm.merchants);
      const posDeposits = posDepositWithNullLocation.map(
        (pos: POSDepositEntity) => {
          const merchant = merchants.find(
            (merch) => merch.merchant_id === pos.merchant_id
          )!;
          return {
            ...pos,
            timestamp: pos.timestamp,
            merchant,
          };
        }
      );
      await this.posDepositService.savePOSDepositEntities(posDeposits);
    }

    if (cashDepositWithnullLocation.length > 0) {
      const banks = ministryLocations.flatMap((itm) => itm.banks);
      const cash = cashDepositWithnullLocation.map(
        (cash: CashDepositEntity) => {
          const bank = banks.find(
            (bank) => bank.bank_id === cash.pt_location_id
          )!;
          return { ...cash, bank };
        }
      );
      await this.cashDepositService.saveCashDepositEntities(cash);
    }

    return { message: 'Success' };
  }

  public transformCSV(file: string): unknown {
    return csv.default().fromString(file.toString());
  }
  /**
   * Seed the file ingestion rules to indicate which programs require which files
   */
  async seedFileIngestionRules() {
    const requiredCashFiles = new ProgramRequiredFileEntity();
    requiredCashFiles.filename = 'F08TDI17';
    requiredCashFiles.fileType = FileTypes.TDI17;

    const requiredPosFiles = new ProgramRequiredFileEntity();
    requiredPosFiles.filename = 'F08TDI34';
    requiredPosFiles.fileType = FileTypes.TDI34;

    const requiredTransactionsFiles = new ProgramRequiredFileEntity();
    requiredTransactionsFiles.filename = 'SBC_SALES';
    requiredTransactionsFiles.fileType = FileTypes.SBC_SALES;

    const rules = [
      {
        program: 'SBC',
        requiredFiles: [
          requiredCashFiles,
          requiredPosFiles,
          requiredTransactionsFiles,
        ],
      },
      {
        program: 'LABOUR',
        requiredFiles: [requiredCashFiles, requiredPosFiles],
      },
    ];

    await this.notificationService.createRulesForProgram(rules);
  }

  /**
   * Seed the master locations from a CSV file of the location data
   */
  async seedLocations() {
    const requestParams: GetObjectCommandInput = {
      Bucket: masterData.Bucket,
      Key: `${masterData.Key}/${masterData.LocationsCSV}`,
    };

    const awsBucketResponse = await this.s3Service.getObjectString(
      requestParams
    );
    const sbcLocationMaster = await csv.default().fromString(awsBucketResponse);
    const locationEntities = sbcLocationMaster.map((loc) => ({ ...loc }));
    await this.locationService.createLocations(locationEntities);
  }

  /**
   * First, seed the "master location" table
   * Then, seed the location, merchant location table,
   * and bank location table
   * together these are a normalized verison of the master location table
   * @param program
   */
  async seedMinistryLocations(program: Ministries) {
    const locations = await this.locationService.findAll();
    // hardcoded stub for a missing location
    const stubLocation98 = {
      id: `${Ministries.SBC}_98`,
      source_id: Ministries.SBC,
      location_id: 98,
      description: 'unk',
      method: 'Bank',
      program_code: 0,
      program_desc: 'unk',
      ministry_client: 0,
      resp_code: 'unk',
      service_line_code: 0,
      stob_code: 0,
      project_code: 0,
      merchant_id: 0,
      pt_location_id: 0,
    };

    await this.locationService.seedMinistryLocations(
      [...locations, stubLocation98].filter((itm) => itm.source_id === program),
      program
    );
  }
  /**
   * Seed the payment methods from a CSV file of the payment method data
   */
  async seedPaymentMethods() {
    const requestParams: GetObjectCommandInput = {
      Bucket: masterData.Bucket,
      Key: `${masterData.Key}/${masterData.PaymentMethodsCSV}`,
    };
    const awsBucketResponse = await this.s3Service.getObjectString(
      requestParams
    );
    const sbcPaymentMethodMaster = await csv
      .default()
      .fromString(awsBucketResponse);
    const locationEntities = sbcPaymentMethodMaster.map(
      (pmnt) => new PaymentMethodEntity({ ...pmnt })
    );
    await this.paymentMethodService.createPaymentMethods(locationEntities);
  }
}
