import { DataSource } from 'typeorm';
import {
  CashDepositEntity,
  POSDepositEntity,
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity,
  LocationView,
  MasterLocationDataEntity
} from '../reconciliation/entities';

{
  /*
    This module defines the datasource for the database connection, and is required for generating, running, and creating migrations via typeorm cli. 
    explicitly specify all entities
    autLoadEntities is not available here

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
    LocationView,
    MasterLocationDataEntity
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'test' ?? false
});
