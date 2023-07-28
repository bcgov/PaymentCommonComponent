import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1690503718109 implements MigrationInterface {
  name = 'daily-date-migration1690503718109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "file_created_date" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "file_created_date" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "file_created_date" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" ALTER COLUMN "daily_date" TYPE TIMESTAMP WITH TIME ZONE USING "daily_date"::TIMESTAMP WITH TIME ZONE`
    );

    await queryRunner.query(
      `ALTER TABLE "file_uploaded" ADD "file_created_date" TIMESTAMP`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" ALTER COLUMN "daily_date" TYPE TIMESTAMP WITH TIME ZONE USING "daily_date"::TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" DROP COLUMN "file_created_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "file_created_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "file_created_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "file_created_date"`
    );
  }
}
