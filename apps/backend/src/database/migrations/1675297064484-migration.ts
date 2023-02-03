import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1675297064484 implements MigrationInterface {
  name = 'migration1675297064484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_06455ff0753337e283091035e11"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "pos_deposit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "cash_deposit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "deposit_id" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "deposit_id"`);
    await queryRunner.query(`ALTER TABLE "payment" ADD "cash_deposit_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "pos_deposit_id" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_06455ff0753337e283091035e11" FOREIGN KEY ("cash_deposit_id") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
