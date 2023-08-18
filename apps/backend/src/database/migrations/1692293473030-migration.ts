import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1692293473030 implements MigrationInterface {
  name = 'migration1692293473030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" DROP COLUMN "retries"`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" DROP COLUMN "retries"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" ADD "retries" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" ADD "retries" integer NOT NULL DEFAULT '0'`
    );
  }
}
