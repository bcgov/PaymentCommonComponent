import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697083746090 implements MigrationInterface {
  name = 'Migration1697083746090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchant_id" TO "merchantId"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" RENAME COLUMN "location_id" TO "locationId"`
    );
    await queryRunner.query(
      `CREATE TABLE "merchant_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "merchant_id" integer NOT NULL, "source_id" character varying NOT NULL, "payment_method" character varying(10), "location" character varying, CONSTRAINT "PK_3048e8b53128abe76c0b9219969" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" character varying NOT NULL, "source_id" character varying(15) NOT NULL, "location_id" integer NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, "pt_location_id" integer NOT NULL, CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("source_id", "location_id"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "locationId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "UQ_a4bd9093c633b8a49a7cef8a519" UNIQUE ("locationId")`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."pos_deposit_heuristic_match_round_enum" RENAME TO "pos_deposit_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_heuristic_match_round_enum" AS ENUM('ZERO', 'ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "heuristic_match_round" TYPE "public"."pos_deposit_heuristic_match_round_enum" USING "heuristic_match_round"::"text"::"public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."pos_deposit_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "merchantId"`
    );
    await queryRunner.query(`ALTER TABLE "pos_deposit" ADD "merchantId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "UQ_ec9e7e6b4bf1cc524ab5ab50d18" UNIQUE ("merchantId")`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_heuristic_match_round_enum" RENAME TO "payment_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_heuristic_match_round_enum" AS ENUM('ZERO', 'ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "heuristic_match_round" TYPE "public"."payment_heuristic_match_round_enum" USING "heuristic_match_round"::"text"::"public"."payment_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "locationId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "UQ_c6a5646ba8a6915e28db1b45f7f" UNIQUE ("locationId")`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_a4bd9093c633b8a49a7cef8a519" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_ec9e7e6b4bf1cc524ab5ab50d18" FOREIGN KEY ("merchantId") REFERENCES "merchant_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_c6a5646ba8a6915e28db1b45f7f" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_location" ADD CONSTRAINT "FK_35f273b3fa7ad91977ba3295db1" FOREIGN KEY ("payment_method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_location" ADD CONSTRAINT "FK_b13f7ede6438f1a2885ac3b6c56" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "merchant_location" DROP CONSTRAINT "FK_b13f7ede6438f1a2885ac3b6c56"`
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_location" DROP CONSTRAINT "FK_35f273b3fa7ad91977ba3295db1"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_c6a5646ba8a6915e28db1b45f7f"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_ec9e7e6b4bf1cc524ab5ab50d18"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_a4bd9093c633b8a49a7cef8a519"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "UQ_c6a5646ba8a6915e28db1b45f7f"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "locationId" integer NOT NULL`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_heuristic_match_round_enum_old" AS ENUM('ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "heuristic_match_round" TYPE "public"."payment_heuristic_match_round_enum_old" USING "heuristic_match_round"::"text"::"public"."payment_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_heuristic_match_round_enum_old" RENAME TO "payment_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "UQ_ec9e7e6b4bf1cc524ab5ab50d18"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "merchantId"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "merchantId" integer NOT NULL`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_heuristic_match_round_enum_old" AS ENUM('ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "heuristic_match_round" TYPE "public"."pos_deposit_heuristic_match_round_enum_old" USING "heuristic_match_round"::"text"::"public"."pos_deposit_heuristic_match_round_enum_old"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."pos_deposit_heuristic_match_round_enum_old" RENAME TO "pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "UQ_a4bd9093c633b8a49a7cef8a519"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "locationId" integer NOT NULL`
    );
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "merchant_location"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" RENAME COLUMN "locationId" TO "location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchantId" TO "merchant_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "locationId" TO "pt_location_id"`
    );
  }
}
