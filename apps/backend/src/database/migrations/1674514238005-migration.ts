import { MigrationInterface, QueryRunner } from 'typeorm';
import { locationQuery } from '../queries/locations';

export class migration1674514238005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(locationQuery);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM public.master_location_data;`);
  }
}
