import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697668650965 implements MigrationInterface {
  name = 'Migration1697668650965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_bank" ("pt_location_id" integer NOT NULL, "source_id" character varying(15), "location" integer, CONSTRAINT "pt_location_id" UNIQUE ("pt_location_id", "source_id", "location"), CONSTRAINT "PK_d474ebd37ea325a4d18d374ecf2" PRIMARY KEY ("pt_location_id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "id_location_idx" ON "location_bank" ("pt_location_id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location_merchant" ("merchant_id" integer NOT NULL, "source_id" character varying(15), "location" integer, CONSTRAINT "merchant_id" UNIQUE ("merchant_id", "source_id", "location"), CONSTRAINT "PK_1363f33b9b07adfac3fcdbbb93d" PRIMARY KEY ("merchant_id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_merchant_idx" ON "location_merchant" ("merchant_id", "source_id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_id" character varying(15) NOT NULL, "location_id" integer NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("location_id", "source_id"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_346127033e9c6ca7ffa2df9ecb" ON "location" ("location_id", "source_id") `
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "location" uuid`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_dd423da8b6167163d79d3c06953" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_aa767c22d7fad98e532a3ff344f" FOREIGN KEY ("merchant_id") REFERENCES "location_merchant"("merchant_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_71b298e334812703ac318c4f255" FOREIGN KEY ("pt_location_id") REFERENCES "location_bank"("pt_location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
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
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_dd423da8b6167163d79d3c06953"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant_id" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "location"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_346127033e9c6ca7ffa2df9ecb"`
    );
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP INDEX "public"."location_merchant_idx"`);
    await queryRunner.query(`DROP TABLE "location_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."id_location_idx"`);
    await queryRunner.query(`DROP TABLE "location_bank"`);
  }
}
