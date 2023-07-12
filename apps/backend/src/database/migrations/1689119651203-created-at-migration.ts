import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1689119651203 implements MigrationInterface {
  name = 'created_at-migration1689119651203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "date_uploaded" TO "created_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "date_uploaded" TO "created_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "created_at" to "date_uploaded"`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "created_at" to "date_uploaded"`
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "created_at"`
    );
  }
}
