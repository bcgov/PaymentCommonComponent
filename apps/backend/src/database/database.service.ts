import { GetObjectCommandInput } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import * as csv from 'csvtojson';
import { masterData } from './const';
import { FileTypes } from '../constants';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { FileIngestionRulesEntity } from '../notification/entities/file-ingestion-rules.entity';
import { NotificationService } from '../notification/notification.service';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { PaymentMethodEntity } from '../transaction/entities';
import { PaymentMethodService } from '../transaction/payment-method.service';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(S3ManagerService) private readonly s3Service: S3ManagerService,
    @Inject(LocationService) private readonly locationService: LocationService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService
  ) {}

  async seedMasterData() {
    const locations: LocationEntity[] = await this.locationService.findAll();

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
  }

  public transformCSV(file: string): unknown {
    return csv.default().fromString(file.toString());
  }

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

  async seedLocations() {
    const requestParams: GetObjectCommandInput = {
      Bucket: masterData.Bucket,
      Key: `${masterData.Key}/${masterData.LocationsCSV}`,
    };

    const awsBucketResponse = await this.s3Service.getObjectString(
      requestParams
    );
    const sbcLocationMaster = await csv.default().fromString(awsBucketResponse);
    const locationEntities = sbcLocationMaster.map(
      (loc) => new LocationEntity({ ...loc })
    );
    await this.locationService.createLocations(locationEntities);
  }

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
