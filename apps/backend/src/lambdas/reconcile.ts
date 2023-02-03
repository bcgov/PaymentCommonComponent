import { LocationService } from './../location/location.service';
import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationEventInput } from '../reconciliation/const';

export const handler = async (
  event?: ReconciliationEventInput,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  /*eslint-disable */
  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const locationService = app.get(LocationService);
  const appLogger = app.get(AppLogger);

  appLogger.log({ event });
  appLogger.log({ context });
  /*eslint-disable */
  const getFiscalDates = async (event: ReconciliationEventInput) => {
    const fiscalStart = new Date(event.fiscal_start_date);
    const fiscalEnd = new Date(event.fiscal_end_date);
    const fiscalDates = [];
    while (fiscalStart <= fiscalEnd) {
      fiscalDates.push(new Date(fiscalStart).toDateString());
      fiscalStart.setDate(fiscalStart.getDate() + 1);
    }
    return fiscalDates.map((itm) => itm.toString());
  };

  const reconcile = async (event: ReconciliationEventInput) => {
    const dates = await getFiscalDates(event);
    if (event.program === 'SBC' && event.location_ids.length === 0) {
      const locations = await Promise.all(
        await locationService.getSBCLocationIDsAndOfficeList()
      );
      const location_ids = locations.map(
        ({ sbc_location }) =>
          sbc_location && event?.location_ids?.push(sbc_location)
      );
    }
    dates.map((date) =>
      event.location_ids.map(async (location_id) => {
        console.log(
          event &&
            (await cashRecon.reconcile({
              date,
              location_id,
              program: event.program
            }))
        );
        console.log(
          event &&
            (await posRecon.reconcile({
              date,
              location_id,
              program: event.program
            }))
        );
      })
    );
  };

  event && (await reconcile(event));
  return {
    message: 'Reconciliation complete'
  };
};

const reconciliationEvent: ReconciliationEventInput = {
  fiscal_start_date: '2023-01-09',
  fiscal_end_date: '2023-01-09',
  program: 'SBC',
  location_ids: []
};

handler(reconciliationEvent);
