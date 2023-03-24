import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1679618910864 implements MigrationInterface {
  name = 'migration1679618910864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "total_transaction_amount" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."pos_deposit_status_enum" RENAME TO "pos_deposit_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION', 'ALL')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" TYPE "public"."pos_deposit_status_enum" USING "status"::"text"::"public"."pos_deposit_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(`DROP TYPE "public"."pos_deposit_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_amt" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "amount" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "foreign_currency_amount" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" SET DEFAULT 'CAD'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_status_enum" RENAME TO "payment_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION', 'ALL')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" TYPE "public"."payment_status_enum" USING "status"::"text"::"public"."payment_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "deposit_time"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "deposit_time" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_curr" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_cdn" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."cash_deposit_status_enum" RENAME TO "cash_deposit_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION', 'ALL')`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" TYPE "public"."cash_deposit_status_enum" USING "status"::"text"::"public"."cash_deposit_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(
      `DROP TYPE "public"."cash_deposit_status_enum_old"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."cash_deposit_status_enum_old" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" TYPE "public"."cash_deposit_status_enum_old" USING "status"::"text"::"public"."cash_deposit_status_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(`DROP TYPE "public"."cash_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."cash_deposit_status_enum_old" RENAME TO "cash_deposit_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_cdn" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_curr" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "deposit_time"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "deposit_time" TIME`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum_old" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" TYPE "public"."payment_status_enum_old" USING "status"::"text"::"public"."payment_status_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_status_enum_old" RENAME TO "payment_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "foreign_currency_amount" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "amount" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_amt" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_status_enum_old" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" TYPE "public"."pos_deposit_status_enum_old" USING "status"::"text"::"public"."pos_deposit_status_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
    );
    await queryRunner.query(`DROP TYPE "public"."pos_deposit_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."pos_deposit_status_enum_old" RENAME TO "pos_deposit_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "total_transaction_amount" TYPE numeric(16,4)`
    );
  }
}
