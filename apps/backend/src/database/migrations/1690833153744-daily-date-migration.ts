import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1690833153744 implements MigrationInterface {
  name = 'migration1690833153744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD "parsed_on" date`);
    await queryRunner.query(`ALTER TABLE "pos_deposit" ADD "parsed_on" date`);
    await queryRunner.query(`ALTER TABLE "cash_deposit" ADD "parsed_on" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "parsed_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "parsed_on"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "parsed_on"`
    );
  }
}
