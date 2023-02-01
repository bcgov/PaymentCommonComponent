import { DataSource } from 'typeorm';
import { MasterLocationDataEntity } from '../location/entities';
import { CashDepositEntity } from '../cash/entities/cash-deposit.entity';
import { POSDepositEntity } from '../pos/entities/pos-deposit.entity';
import {
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity
} from '../sales/entities';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'pcc',
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

