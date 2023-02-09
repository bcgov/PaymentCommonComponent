import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbLogger, logLevels } from './helpers';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'pcc',
        logging: logLevels,
        logger: dbLogger,
        autoLoadEntities: true,
        synchronize: false
      })
    })
  ]
})
export class DatabaseModule {}
