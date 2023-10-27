import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698272814172 implements MigrationInterface {
  name = 'LocationMigration1698272814172';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchant_id" TO "merchant"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "bank"`
    );
    await queryRunner.query(
      `CREATE TABLE "location_bank" ("id" integer NOT NULL, "location" uuid, CONSTRAINT "id" UNIQUE ("id", "location"), CONSTRAINT "PK_eeba479525aaefa12e7f3b3be68" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "id_location_idx" ON "location_bank" ("id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location_merchant" ("id" integer NOT NULL, "location" uuid, CONSTRAINT "UQ_a50b1aa45ef71839eea10b3acc6" UNIQUE ("id", "location"), CONSTRAINT "PK_b9e23b9c6e585e7466134d76a93" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_merchant_idx" ON "location_merchant" ("id", "location") `
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_id" character varying(10) NOT NULL, "location_id" integer NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("location_id", "source_id"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("id", "location_id", "source_id") `
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "location" uuid`);
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "source_id" TYPE character varying(10) USING "source_id"::"varchar"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "source_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_97f65ebeda56712afd907d46bbe" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_9c1f8d6a86dd85962087d7f5dd3" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_9c1f8d6a86dd85962087d7f5dd3"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_97f65ebeda56712afd907d46bbe"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "source_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ADD "source_id" character varying(15) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "location"`);
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP INDEX "public"."location_merchant_idx"`);
    await queryRunner.query(`DROP TABLE "location_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."id_location_idx"`);
    await queryRunner.query(`DROP TABLE "location_bank"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "bank" TO "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchant" TO "merchant_id"`
    );
  }
}
