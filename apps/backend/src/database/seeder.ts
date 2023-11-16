import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { DatabaseService } from './database.service';
import { AppModule } from '../app.module';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event?: unknown, _context?: Context) => {
  console.log('Starting migrations...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dbService = app.get(DatabaseService);
  try {
    console.log('Migration complete.');

    console.log('Seeding Master Data...');

    await dbService.seedMasterData();
    console.log('...complete...');

    console.log('Seeding Location Data...');

    await dbService.seedLocationData();
    console.log('...complete...');

    console.log('Updating TXN and Deposit Data...');
    await dbService.updateTxnsAndDeposits();
    console.log('...complete...');

    return 'success';
  } catch (e) {
    console.log(e);
    console.log('Migration failure.');
    return 'failure';
  }
};
