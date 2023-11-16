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
  MasterLocationEntity,
  MinistryLocationEntity,
} from '../location/entities';
import { LocationService } from '../location/location.service';
import { AppLogger } from '../logger/logger.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import {
  PaymentMethodEntity,
  TransactionEntity,
} from '../transaction/entities';
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
    private readonly cashDepositService: CashDepositService,
    @Inject(AppLogger)
    private readonly appLogger: AppLogger
  ) {
    appLogger.setContext(DatabaseService.name);
  }
  /**
   * We rely on "master" data to join our txn/deposit table in order to match
   */
  async seedMasterData() {
    this.appLogger.setContext('Seed Master Data');
    const locations: MasterLocationEntity[] =
      await this.locationService.findAll();
    this.appLogger.log(
      `Found ${locations.length} rows in Master Location table`
    );

    const paymentMethods: PaymentMethodEntity[] =
      await this.paymentMethodService.getPaymentMethods();
    this.appLogger.log(
      `Found ${paymentMethods.length} rows in Payment Method table`
    );

    const rules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();
    this.appLogger.log(
      `Found ${rules.length} rows in File Ingestion Rules table`
    );

    if (rules.length === 0) {
      this.appLogger.log(`No rules found, seeding...`);
      await this.seedFileIngestionRules();
    }

    if (locations.length === 0) {
      this.appLogger.log(`No locations found, seeding...`);
      await this.seedLocations();
    }
    if (paymentMethods.length === 0) {
      this.appLogger.log(`No payment methods found, seeding...`);
      await this.seedPaymentMethods();
    }
  }

  async seedLocationData() {
    this.appLogger.setContext('Seed Locations Data');
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
      }
    }
  }

  async updateTxnsAndDeposits() {
    this.appLogger.setContext('Update TXN and Deposit with Location Seed Data');
    const ministryLocations: MinistryLocationEntity[] =
      await this.locationService.findMinistryLocationsBySource(Ministries.SBC);

    this.appLogger.log(`Ministry Locations: ${ministryLocations.length}`);

    const transactionsWithNullLocation: TransactionEntity[] =
      await this.transactionService.findWithNullLocation(Ministries.SBC);

    this.appLogger.log(
      `Transactions With Null Locations: ${transactionsWithNullLocation.length}`
    );

    if (transactionsWithNullLocation.length > 0) {
      const txns = transactionsWithNullLocation.map((txn) => {
        const location = ministryLocations.find(
          (loc) =>
            loc.source_id === txn.source_id &&
            loc.location_id === txn.location_id
        );

        if (!location) {
          throw new Error('Location not found');
        }
        return {
          ...txn,
          location,
        };
      });

      this.appLogger.log(`Transactions With Locations Updated: ${txns.length}`);

      await this.transactionService.updateAndSaveTxns(txns);
    }

    const programRules: FileIngestionRulesEntity[] =
      await this.notificationService.getAllRules();

    for (const rule of programRules) {
      this.appLogger.log(`Program: ${rule.program}`);
      const posDepositWithNullLocation =
        await this.posDepositService.findWithNullLocation(Ministries.SBC);
      this.appLogger.log(
        `POS Deposits With Null Locations: ${posDepositWithNullLocation.length}`
      );
      const cashDepositWithnullLocation =
        await this.cashDepositService.findWithNullLocation(Ministries.SBC);
      this.appLogger.log(
        `Cash Deposits With Null Locations: ${cashDepositWithnullLocation.length}`
      );

      if (posDepositWithNullLocation.length > 0) {
        const merchants = ministryLocations
          .filter((itm) => itm.source_id === rule.program)
          .flatMap((itm) => itm.merchants);

        this.appLogger.log(`${rule.program} Merchants: ${merchants.length}`);

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

        this.appLogger.log(
          `POS Deposits With Locations Updated: ${posDeposits.length}`
        );

        await this.posDepositService.updateAndSavePOSDeposits(posDeposits);
      }

      if (cashDepositWithnullLocation.length > 0) {
        const banks = ministryLocations
          .filter((itm) => itm.source_id === rule.program)
          .flatMap((itm) => itm.banks);

        this.appLogger.log(`${rule.program} Banks: ${banks.length}`);

        const cash = cashDepositWithnullLocation.map(
          (cash: CashDepositEntity) => {
            const bank = banks.find(
              (bank) => bank.bank_id === cash.pt_location_id
            )!;
            return { ...cash, bank };
          }
        );

        this.appLogger.log(
          `Cash Deposits With Locations Updated: ${cash.length}`
        );

        await this.cashDepositService.updateAndSaveCashDeposits(cash);
      }
    }
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
