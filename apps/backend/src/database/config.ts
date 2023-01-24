import { DataSource } from 'typeorm';
import {
  CashDepositEntity,
  POSDepositEntity,
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity,
  MasterLocationDataEntity
} from '../reconciliation/entities';

{
  /*
   * This module is specific to Typeorm v3.
   * It defines the datasource for the database connection, and is required for generating, running, and creating migrations via typeorm cli.
   * Explicitly specify all entities as autoLoadEntities is not available here
   * I have set fallback values as possibly undefined values are not allowed.
   */
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'bcpcc',
  entities: [
    PaymentMethodEntity,
    PaymentEntity,
    TransactionEntity,
    POSDepositEntity,
    CashDepositEntity,
    MasterLocationDataEntity
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false
});
