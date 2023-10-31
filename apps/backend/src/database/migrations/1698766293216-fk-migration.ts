import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698766293216 implements MigrationInterface {
  name = 'FKMigration1698766293216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(`ALTER TABLE "transaction" ADD "location" uuid`);
    await queryRunner.query(`ALTER TABLE "pos_deposit" ADD "merchant" uuid`);
    await queryRunner.query(`ALTER TABLE "cash_deposit" ADD "bank" uuid`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("location_id", "source_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_dd423da8b6167163d79d3c06953" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_0c2d1a0d19b5b5ea5f0af5f3bf2" FOREIGN KEY ("merchant") REFERENCES "location_merchant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_0889fcbcebfdf2845d242627936" FOREIGN KEY ("bank") REFERENCES "location_bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_0889fcbcebfdf2845d242627936"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_0c2d1a0d19b5b5ea5f0af5f3bf2"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_dd423da8b6167163d79d3c06953"`
    );
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(`ALTER TABLE "cash_deposit" DROP COLUMN "bank"`);
    await queryRunner.query(`ALTER TABLE "pos_deposit" DROP COLUMN "merchant"`);
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "location"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("id", "source_id", "location_id") `
    );
  }
}
