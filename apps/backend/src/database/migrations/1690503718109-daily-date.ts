import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1690503718109 implements MigrationInterface {
  name = 'daily-date-migration1690503718109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "file_created_date" date`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "file_created_date" date`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "file_created_date" date`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
