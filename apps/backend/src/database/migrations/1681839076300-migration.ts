import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1681839076300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "payment_method" WHERE "method" = 'MV'`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ALTER COLUMN "classification" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "payment_method" VALUES('MV', 'DEBIT_MASTERCARD', 19, 'POS')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ALTER COLUMN "classification" DROP NOT NULL`
    );
  }
}
