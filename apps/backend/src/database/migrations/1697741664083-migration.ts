import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697741664083 implements MigrationInterface {
  name = 'Migration1697741664083';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "id_location_idx" ON "location_bank" ("id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_merchant_idx" ON "location_merchant" ("id", "source_id", "location") `
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "id" UNIQUE ("id", "source_id", "location")`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "UQ_169c6b566ce3e496196c73e4347" UNIQUE ("id", "source_id", "location")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "UQ_169c6b566ce3e496196c73e4347"`
    );
    await queryRunner.query(`ALTER TABLE "location_bank" DROP CONSTRAINT "id"`);
    await queryRunner.query(`DROP INDEX "public"."location_merchant_idx"`);
    await queryRunner.query(`DROP INDEX "public"."id_location_idx"`);
  }
}
