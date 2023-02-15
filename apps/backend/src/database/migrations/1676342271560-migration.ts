import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1676342271560 implements MigrationInterface {
  name = 'migration1676342271560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_06455ff0753337e283091035e11"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_69c08e5ceb8b373d3f3f5d3f5b3"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_bc1e7b7438cdc9fa47ccb0e19fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" RENAME COLUMN "method" TO "type"`
    );
    await queryRunner.query(`ALTER TABLE "cash_deposit" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."cash_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "pos_deposit_id"`
    );
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "cash_deposit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "exceptions_log"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "PK_6e02e5a0a6a7400e1c944d1e946"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "transaction_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "total_payment_amount"`
    );
    await queryRunner.query(`ALTER TABLE "pos_deposit" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."pos_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "payment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "exceptions_log"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "match" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "cash_payment_ids" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "match" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "id" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "amount" numeric(16,4) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "matched_payment_id" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "matched_payment_id"`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "amount"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9"`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "match"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "cash_payment_ids"`
    );
    await queryRunner.query(`ALTER TABLE "cash_deposit" DROP COLUMN "match"`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "exceptions_log" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "payment_id" character varying`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "status" "public"."pos_deposit_status_enum" NOT NULL DEFAULT 'PENDING'`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "total_payment_amount" numeric(16,4) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "transaction_id" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "PK_6e02e5a0a6a7400e1c944d1e946" PRIMARY KEY ("transaction_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "exceptions_log" integer`
    );
    await queryRunner.query(`ALTER TABLE "payment" ADD "cash_deposit_id" uuid`);
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "status" "public"."payment_status_enum" NOT NULL DEFAULT 'PENDING'`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "pos_deposit_id" character varying`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "status" "public"."cash_deposit_status_enum" NOT NULL DEFAULT 'PENDING'`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" RENAME COLUMN "type" TO "method"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_bc1e7b7438cdc9fa47ccb0e19fe" FOREIGN KEY ("exceptions_log") REFERENCES "reconciliation_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_69c08e5ceb8b373d3f3f5d3f5b3" FOREIGN KEY ("exceptions_log") REFERENCES "reconciliation_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_06455ff0753337e283091035e11" FOREIGN KEY ("cash_deposit_id") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
