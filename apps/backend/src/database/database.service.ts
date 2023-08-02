import { Inject, Injectable } from '@nestjs/common';
import * as csv from 'csvtojson';
import { LocationEntity } from '../location/entities';
import { LocationService } from '../location/location.service';
import { S3ManagerService } from '../s3-manager/s3-manager.service';
import { PaymentMethodEntity } from '../transaction/entities';
import { PaymentMethodService } from '../transaction/payment-method.service';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(S3ManagerService) private readonly s3Service: S3ManagerService,
    @Inject(LocationService) private readonly locationService: LocationService,
    @Inject(PaymentMethodService)
    private readonly paymentMethodService: PaymentMethodService
  ) {}

  public transformCSV(file: string): unknown {
    return csv.default().fromString(file.toString());
  }

  async seedMasterData() {
    const locationsCSV = 'locations.csv';
    const paymentMethodsCSV = 'payment_method.csv';
    const bucket = 'pcc-master-data';
    const key = 'master_data';

    const locations: LocationEntity[] = await this.locationService.findAll();

    const paymentMethods: PaymentMethodEntity[] =
      await this.paymentMethodService.getPaymentMethods();

    if (locations.length === 0) {
      const locationsData = await this.s3Service.getObject(
        bucket,
        `${key}/${locationsCSV}`
      );
      const file = locationsData?.Body?.toString('utf-8') ?? '';
      const sbcLocationMaster = await csv.default().fromString(file);
      const locationEntities = sbcLocationMaster.map(
        (loc) => new LocationEntity({ ...loc })
      );
      await this.locationService.seedLocations(locationEntities);
    }

    if (paymentMethods.length === 0) {
      const paymentMethodsData = await this.s3Service.getObject(
        bucket,
        `${key}/${paymentMethodsCSV}`
      );
      const file = paymentMethodsData?.Body?.toString('utf-8') ?? '';
      const sbcPmntMethodsMaster = await csv.default().fromString(file);
      const locationEntities = sbcPmntMethodsMaster.map(
        (pmnt) => new PaymentMethodEntity({ ...pmnt })
      );
      await this.paymentMethodService.seedPaymentMethods(locationEntities);
    }
  }
}
