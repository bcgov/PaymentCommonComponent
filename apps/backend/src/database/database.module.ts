import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PaymentMethodEntity,
  LocationView,
  MasterLocationDataEntity
} from '../reconciliation/entities';

{
  /*
    This module is responsible for configuring the database connection.
    explicitly specify entities which are not loaded as TypeOrmModule.forFeature() in another module
    autLoadEntities: true will load all entities in the entities folder, as long as they are loaded with forFeature 
    elsewhere
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
        entities: [LocationView, MasterLocationDataEntity, PaymentMethodEntity],
        autoLoadEntities: true,
        synchronize: false
      })
    })
  ]
})
export class DatabaseModule {}
