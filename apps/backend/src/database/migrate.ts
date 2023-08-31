import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { DataSource, MigrationExecutor } from 'typeorm';
import { AppModule } from '../app.module';
import { AppLogger } from '../logger/logger.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event?: unknown, _context?: Context) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appLogger = app.get(AppLogger);
  const db = app.get(DataSource);
  appLogger.log(`Database Initialized: ${db.isInitialized}`);
  try {
    if (!db.isInitialized) {
      appLogger.log('Initializing database connection...');
    }

    const migrationExecutor = new MigrationExecutor(db, db.createQueryRunner());
    appLogger.log(db.migrations);
    appLogger.log('Migration executor created.');
    const executed = await migrationExecutor.getExecutedMigrations();

    const pending = await migrationExecutor.getPendingMigrations();

    appLogger.log('---> executed:');
    appLogger.log(executed.map((mig) => mig.name));

    appLogger.log('---> pending:');
    appLogger.log(pending.map((mig) => mig.name));

    const run = await migrationExecutor.executePendingMigrations();

    appLogger.log('---> ran now:');
    appLogger.log(run.map((mig) => mig.name));

    appLogger.log('Migration complete.');
    return 'success';
  } catch (e) {
    appLogger.log(e);
    appLogger.log('Migration failure.');
    return 'failure';
  }
};
