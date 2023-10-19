import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697741464841 implements MigrationInterface {
  name = 'Migration1697741464841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."id_location_idx"`);
    await queryRunner.query(`DROP INDEX "public"."location_merchant_idx"`);
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "merchant_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" RENAME COLUMN "pt_location_id" TO "id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" RENAME CONSTRAINT "PK_d474ebd37ea325a4d18d374ecf2" TO "PK_eeba479525aaefa12e7f3b3be68"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" RENAME COLUMN "merchant_id" TO "id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" RENAME CONSTRAINT "PK_1363f33b9b07adfac3fcdbbb93d" TO "PK_b9e23b9c6e585e7466134d76a93"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_merchant" RENAME CONSTRAINT "PK_b9e23b9c6e585e7466134d76a93" TO "PK_1363f33b9b07adfac3fcdbbb93d"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" RENAME COLUMN "id" TO "merchant_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" RENAME CONSTRAINT "PK_eeba479525aaefa12e7f3b3be68" TO "PK_d474ebd37ea325a4d18d374ecf2"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" RENAME COLUMN "id" TO "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "merchant_id" UNIQUE ("merchant_id", "source_id", "location")`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "pt_location_id" UNIQUE ("pt_location_id", "source_id", "location")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_merchant_idx" ON "location_merchant" ("merchant_id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "id_location_idx" ON "location_bank" ("pt_location_id", "source_id", "location") `
    );
  }
}
