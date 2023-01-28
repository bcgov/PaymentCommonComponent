import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger.service';
import { ReconciliationService } from './../reconciliation/reconciliation.service';

//WIP
export const handler = async (event?: any, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reconService = app.get(ReconciliationService);
  const appLogger = app.get(AppLogger);
  appLogger.log({ event });
  appLogger.log({ context });

  //TODO
  // const { date, location_id } = event;
  const date = '2023-01-17';
  const location_id = 61;
  const pos_reconciled_by_office = await reconService.reconcilePOS(
    date,
    location_id
  );
  const cash_reconciled_by_office = await reconService.reconcileCash(
    date,
    location_id
  );

  // const allCash = await reconService.reconcileAllCash(date);
  // const allPOS = await reconService.reconcileAllPOS(date);
  console.log(pos_reconciled_by_office);
  console.log(cash_reconciled_by_office);
  // console.log(allPOS);
  // console.log(allCash);
  return {
    pos_reconciled_by_office,
    cash_reconciled_by_office
    // allCash
    // allPOS
  };
};
