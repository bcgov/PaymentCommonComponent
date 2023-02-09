import { DataSource } from 'typeorm';
import { dbLogger, logLevels } from './helpers';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../location/entities';
import { LogEntity } from '../logger/entities/log.entity';
import {
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity
} from '../transaction/entities/index';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'pcc',
  entities: [
    LogEntity,
    PaymentMethodEntity,
    PaymentEntity,
    TransactionEntity,
    POSDepositEntity,
    CashDepositEntity,
    LocationEntity
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: logLevels,
  logger: dbLogger
});
