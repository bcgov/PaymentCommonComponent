import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { EventTypeEnum, ReconciliationEvent } from '../reconciliation/const';
import { LocationService } from '../location/location.service';
export const handler = async (
  event?: ReconciliationEvent,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);

  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const locationService = app.get(LocationService);
  const appLogger = app.get(AppLogger);

  appLogger.log({ event });
  appLogger.log({ context });
  /*eslint-disable */
  // const reconcileAll = () => {
  //   locationService.getSBCLocationIDsAndOfficeList().then((locations) => {
  //     locations.forEach(async (location) => {
  //       if (location.sbc_location && event) {
  //         event.location_id = location.sbc_location;
  //         await posRecon.reconcile({ ...event, type: EventTypeEnum.POS });
  //         await cashRecon.reconcile({ ...event, type: EventTypeEnum.CASH });
  //       }
  //     });
  //   });
  // };
  /*eslint-disable */

  console.log(
    event &&
      (await posRecon.reconcile(
        { ...event, type: EventTypeEnum.POS },
        await locationService.getMerchantIdsByLocationId(event.location_id)
      ))
  );
  console.log(
    event && (await cashRecon.reconcile({ ...event, type: EventTypeEnum.CASH }))
  );

  return {
    message: 'Reconciliation complete'
  };
};

const reconciliationEvent: ReconciliationEvent = {
  date: '2023-01-16',
  location_id: 8,
  program: 'SBC',
  type: EventTypeEnum.POS
};

handler(reconciliationEvent);
