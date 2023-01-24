import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterLocationDataEntity } from '../reconciliation/entities';

{
  /*
   * This module is responsible for configuring the database connection.
   * Explicitly specify entities which are not loaded as TypeOrmModule.forFeature() in another module
   */
}
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432') ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'bcpcc',
        entities: [MasterLocationDataEntity],
        autoLoadEntities: true,
        synchronize: false
      })
    })
  ]
})
export class DatabaseModule {}
