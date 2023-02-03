import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { CashReconciliationService } from '../reconciliation/cash-reconciliation.service';
import { POSReconciliationService } from '../reconciliation/pos-reconciliation.service';
import { ReconciliationEvent } from '../reconciliation/const';

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

  const reconcile = async (event: ReconciliationEvent) => {};

  console.log(event && (await cashRecon.reconcile(event)));
  console.log(event && (await posRecon.reconcile(event)));
  return {
    message: 'Reconciliation complete'
  };
};

const reconciliationEvent: ReconciliationEvent = {
  date: '2023-01-31',
  program: 'SBC',
  location_id: 61
};

handler(reconciliationEvent);
