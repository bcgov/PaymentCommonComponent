import { LocationService } from './../location/location.service';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { EventTypeEnum, ReconciliationEvent } from '../reconciliation/const';

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

  const reconcileAll = () => {
    locationService.getSBCLocationIDsAndOfficeList().then((locations) => {
      locations.forEach((location) => {
        if (location.sbc_location && event) {
          event.location_id = location.sbc_location;
          posRecon.reconcile({ ...event, type: EventTypeEnum.POS });
          cashRecon.reconcile({ ...event, type: EventTypeEnum.CASH });
        }
      });
    });
  };

  return {
    reconcileAll
  };
};

const reconciliationEvent: ReconciliationEvent = {
  date: '2023-01-23',
  location_id: 61,
  program: 'SBC',
  type: EventTypeEnum.POS
};

handler(reconciliationEvent);
