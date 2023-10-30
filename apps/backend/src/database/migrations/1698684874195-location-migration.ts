import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698684874195 implements MigrationInterface {
  name = 'LocationMigration1698684874195';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_id" character varying(15) NOT NULL, "location_id" integer NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, CONSTRAINT "UQ_62c907775331b5aa98ec8daf7dd" UNIQUE ("id", "location_id", "source_id"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("id", "location_id", "source_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "location_merchant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merchant_id" integer NOT NULL, "location" uuid, CONSTRAINT "PK_b9e23b9c6e585e7466134d76a93" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "location_bank" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_id" integer NOT NULL, "location" uuid, CONSTRAINT "PK_eeba479525aaefa12e7f3b3be68" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_9c1f8d6a86dd85962087d7f5dd3" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_97f65ebeda56712afd907d46bbe" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_97f65ebeda56712afd907d46bbe"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_9c1f8d6a86dd85962087d7f5dd3"`
    );
    await queryRunner.query(`DROP TABLE "location_bank"`);
    await queryRunner.query(`DROP TABLE "location_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(`DROP TABLE "location"`);
  }
}
