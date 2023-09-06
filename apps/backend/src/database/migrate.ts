import { NestFactory } from '@nestjs/core';
import { Context } from 'aws-lambda';
import { MigrationExecutor } from 'typeorm';
import { DatabaseService } from './database.service';
import db from './datasource';
import { AppModule } from '../app.module';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (_event?: unknown, _context?: Context) => {
  console.log('Starting migrations...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dbService = app.get(DatabaseService);
  try {
    if (!db.isInitialized) {
      await db.initialize();
    }

    const migrationExecutor = new MigrationExecutor(db, db.createQueryRunner());

    const executed = await migrationExecutor.getExecutedMigrations();
    const pending = await migrationExecutor.getPendingMigrations();

    console.log('---> executed:');
    console.log(executed.map((mig) => mig.name));

    console.log('---> pending:');
    console.log(pending.map((mig) => mig.name));

    const run = await migrationExecutor.executePendingMigrations();

    console.log('---> ran now:');
    console.log(run.map((mig) => mig.name));

    console.log('Migration complete.');

    await dbService.seedMasterData();

    return 'success';
  } catch (e) {
    console.log(e);
    console.log('Migration failure.');
    return 'failure';
  }
};

handler();
