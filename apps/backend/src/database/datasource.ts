import { DataSource } from 'typeorm';
import { entities } from './entity.config';
import { dbLogger, logLevels } from './helpers';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'pcc',
  entities,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: logLevels,
  logger: dbLogger,
});
