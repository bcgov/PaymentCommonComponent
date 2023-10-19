import { MigrationInterface, QueryRunner } from 'typeorm';

export class LocationMigration1697742885047 implements MigrationInterface {
  name = 'LocationMigration1697742885047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_bank" ("id" integer NOT NULL, "source_id" character varying(15), "location" integer, CONSTRAINT "id" UNIQUE ("id", "source_id", "location"), CONSTRAINT "PK_eeba479525aaefa12e7f3b3be68" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "id_location_idx" ON "location_bank" ("id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location_merchant" ("id" integer NOT NULL, "source_id" character varying(15), "location" integer, CONSTRAINT "UQ_169c6b566ce3e496196c73e4347" UNIQUE ("id", "source_id", "location"), CONSTRAINT "PK_b9e23b9c6e585e7466134d76a93" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_merchant_idx" ON "location_merchant" ("id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("source_id" character varying(15) NOT NULL, "location_id" integer NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("location_id", "source_id"), CONSTRAINT "PK_346127033e9c6ca7ffa2df9ecbf" PRIMARY KEY ("source_id", "location_id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("location_id", "source_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" DROP CONSTRAINT "PK_cba6dfaafb30f4e7fe0572acb73"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ADD CONSTRAINT "PK_f2c6d2b1367b207377c873ce43d" PRIMARY KEY ("source_id", "location_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "method" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "source_id" TYPE character varying(15) USING "source_id"::"character varying(15)"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(15)`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "pt_location_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("source_id", "location_id") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_aa767c22d7fad98e532a3ff344f" FOREIGN KEY ("merchant_id") REFERENCES "location_merchant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_71b298e334812703ac318c4f255" FOREIGN KEY ("pt_location_id") REFERENCES "location_bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_71b298e334812703ac318c4f255"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_aa767c22d7fad98e532a3ff344f"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "pt_location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(10) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "method" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" DROP CONSTRAINT "PK_f2c6d2b1367b207377c873ce43d"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ADD CONSTRAINT "PK_cba6dfaafb30f4e7fe0572acb73" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP INDEX "public"."location_merchant_idx"`);
    await queryRunner.query(`DROP TABLE "location_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."id_location_idx"`);
    await queryRunner.query(`DROP TABLE "location_bank"`);
  }
}
