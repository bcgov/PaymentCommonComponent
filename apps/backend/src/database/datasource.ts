import { DataSource } from 'typeorm';
import { dbLogger, logLevels } from './helpers';
import { CashDepositEntity } from '../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../deposits/entities/pos-deposit.entity';
import { LocationEntity } from '../location/entities';
import { FileIngestionRulesEntity } from '../parse/entities/file-ingestion-rules.entity';
import { FileUploadedEntity } from '../parse/entities/file-uploaded.entity';
import { ProgramDailyUploadEntity } from '../parse/entities/program-daily-upload.entity';
import { ProgramRequiredFileEntity } from '../parse/entities/program-required-file.entity';
import {
  TransactionEntity,
  PaymentEntity,
  PaymentMethodEntity,
} from '../transaction/entities/index';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'pcc',
  entities: [
    PaymentMethodEntity,
    PaymentEntity,
    TransactionEntity,
    POSDepositEntity,
    CashDepositEntity,
    LocationEntity,
    FileUploadedEntity,
    ProgramDailyUploadEntity,
    FileIngestionRulesEntity,
    ProgramRequiredFileEntity,
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: logLevels,
  logger: dbLogger,
});
