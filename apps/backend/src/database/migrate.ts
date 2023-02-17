import { MigrationExecutor } from 'typeorm';
import db from './datasource';

export async function migrateDatabase() {
  try {
    await db.initialize();
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

    await db.destroy();

    console.log('Migration complete.');
    return 'success';

  } catch (e) {
    console.log(e);
    db.destroy();
    console.log('Migration failure.');
    return 'failure';
  }
}
