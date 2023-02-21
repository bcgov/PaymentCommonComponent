import { MigrationExecutor } from 'typeorm';
import db from './datasource';
import { Context } from 'aws-lambda';

/* eslint-disable @typescript-eslint/no-unused-vars */
export const handler = async (event?: unknown, context?: Context) => {
  console.log('Starting migrations...');
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
    return 'success';
  } catch (e) {
    console.log(e);
    console.log('Migration failure.');
    return 'failure';
  }
};

handler();
