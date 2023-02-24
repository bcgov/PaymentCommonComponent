import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677200181026 implements MigrationInterface {
  name = 'migration1677200181026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "card_vendor" TYPE character varying(2) `
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "matched_payment_id"`
    );
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "match"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "deposit_id"`);
    await queryRunner.query(`ALTER TABLE "cash_deposit" DROP COLUMN "match"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "cash_payment_ids"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );

    await queryRunner.query(
      `ALTER TABLE "payment" ADD "status" "public"."payment_status_enum" NOT NULL DEFAULT 'PENDING'`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "cash_deposit_match" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "pos_deposit_match" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "UQ_e24ee9d4e22bd555c996de2cb14" UNIQUE ("pos_deposit_match")`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "status" "public"."cash_deposit_status_enum" NOT NULL DEFAULT 'PENDING'`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "status" "public"."pos_deposit_status_enum" NOT NULL DEFAULT 'PENDING'`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "card_id" TYPE character varying(19)`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "terminal_no" TYPE character varying(19)`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "seq_no" TYPE character varying(3)`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "location_desc" TYPE character varying(40) `
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" SET NOT NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "destination_bank_no" TYPE character varying(4) `
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "location_id" TYPE integer`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" TYPE integer`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_581f9ad963cae8659e17496269d" FOREIGN KEY ("cash_deposit_match") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_e24ee9d4e22bd555c996de2cb14" FOREIGN KEY ("pos_deposit_match") REFERENCES "pos_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_e24ee9d4e22bd555c996de2cb14"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_581f9ad963cae8659e17496269d"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" TYPE numeric`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "location_id" TYPE numeric`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "destination_bank_no" TYPE character varying `
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "location_desc" TYPE character varying `
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "seq_no" TYPE character varying`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "terminal_no" TYPE character varying`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "card_id" TYPE character varying`
    );

    await queryRunner.query(`ALTER TABLE "pos_deposit" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."pos_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "status" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(`ALTER TABLE "cash_deposit" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."cash_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "UQ_e24ee9d4e22bd555c996de2cb14"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "pos_deposit_match"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "cash_deposit_match"`
    );
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "cash_payment_ids" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "match" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "deposit_id" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "match" boolean NOT NULL DEFAULT false`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD COLUMN "matched_payment_id" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "location_id" DROP NOT NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "card_vendor" TYPE character varying`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
