import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698273750657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE transaction AS t
        SET location = (
            SELECT l.id
            FROM location AS l
            WHERE l.source_id = t.source_id
            AND l.location_id = t.location_id
        );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE transaction AS t
        SET location = null
        `);
  }
}
