import { DataSource } from 'typeorm';
import databaseConfig from './database-config';

export const db = new DataSource(databaseConfig);
