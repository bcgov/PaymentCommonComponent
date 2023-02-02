import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import {
  ReconciliationTypes,
  ReconciliationEvent
} from '../reconciliation/const';

export const handler = async (
  event?: ReconciliationEvent,
  context?: Context
) => {
  const app = await NestFactory.createApplicationContext(AppModule);

  const cashRecon = app.get(CashReconciliationService);
  const posRecon = app.get(POSReconciliationService);
  const appLogger = app.get(AppLogger);

  appLogger.log({ event });
  appLogger.log({ context });
  /*eslint-disable */

  const getAllDatesInFiscalPeriod = (event: ReconciliationEvent) => {
    const dates = [];
    const start = new Date(event.fiscal_start_date);
    const end = new Date(event.fiscal_close_date);
    while (start <= end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  };

  const reconcile = async (event: ReconciliationEvent) => {
    const dates = getAllDatesInFiscalPeriod(event);
    event.location_ids?.forEach((location) => {
      dates.forEach((date) => {
        ReconciliationTypes.CASH ||
          (ReconciliationTypes.ALL &&
            cashRecon.reconcile({
              ...event,
              location_id: location,
              date: date.toString(),
              type: ReconciliationTypes.CASH
            }));
        ReconciliationTypes.POS ||
          (ReconciliationTypes.ALL &&
            posRecon.reconcile({
              ...event,
              location_id: location,
              date: date.toString(),
              type: ReconciliationTypes.POS
            }));
      });
    });
  };
  event && reconcile(event);
  return {
    message: 'Reconciliation complete'
  };
};

const reconciliationEvent: ReconciliationEvent = {
  fiscal_start_date: '2023-01-11',
  fiscal_close_date: '2023-01-31',
  program: 'SBC',
  location_ids: [],
  type: ReconciliationTypes.ALL
};

const reconciliationEvent2: ReconciliationEvent = {
  fiscal_start_date: '2023-01-11',
  fiscal_close_date: '2023-01-11',
  program: 'SBC',
  location_ids: [31],
  type: ReconciliationTypes.POS
};

handler(reconciliationEvent);
