import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1687722600557 implements MigrationInterface {
  name = 'migration1687722600557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "reconciled_on" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "in_progress_on" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "reconciled_on" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "in_progress_on" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "reconciled_on" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "in_progress_on" TIMESTAMP`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "in_progress_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "reconciled_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "in_progress_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "reconciled_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "in_progress_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "reconciled_on"`
    );
  }
}
