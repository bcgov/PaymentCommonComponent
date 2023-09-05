import { DataSource } from 'typeorm';
import { entities } from './entity.config';
import { dbLogger, logLevels } from './helpers';

const migrationsFolder = [__dirname + '/migrations/**/*{.ts,.js}'];

// Load migrations using Webpack contexts when building the app using webpack.
// This is necessary seeing as webpack bundles all app files, so there won't
// be any migrations in the /migrations folder for typeorm to pick up.
const loadMigrationsWithWebpack = () => {
  const context = (<any>require).context('./migrations', true, /\.js|\.ts/); // eslint-disable-line @typescript-eslint/no-explicit-any
  return context
    .keys()
    .sort()
    .map((fn: string) => {
      const module = context(fn);

      return Object.keys(module).reduce((result, key) => {
        const exportedEntity = module[key];

        if (typeof exportedEntity === 'function') {
          return result.concat(exportedEntity);
        }

        return result;
      }, []);
    })
    .flat();
};

let migrations;

try {
  migrations = loadMigrationsWithWebpack();
} catch (e) {
  migrations = migrationsFolder;
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'pcc',
  entities,
  migrations: migrations,
  synchronize: false,
  logging: logLevels,
  logger: dbLogger,
});
