import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { DatabaseService } from './database.service';
import { db } from './datasource';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event?: unknown, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const databaseService = app.get(DatabaseService);
  appLogger.log(`Database Initialized: ${db.isInitialized}`);
  try {
    if (!db.isInitialized) {
      await db.initialize();
      appLogger.log('Initializing database connection...');
    }

    await databaseService.runMigrations();
    await databaseService.seedMasterData();
    app.close();
    return 'success';
  } catch (e) {
    appLogger.log(e);
    appLogger.log('Migration failure.');
    app.close();
    return 'failure';
  }
};
