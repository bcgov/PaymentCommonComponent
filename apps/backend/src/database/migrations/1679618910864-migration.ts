import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1679618910864 implements MigrationInterface {
  name = 'migration1679618910864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "total_transaction_amount" TYPE numeric(16,2)`
    );

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
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_curr" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric(16,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_amt_cdn" TYPE numeric(16,2)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE "transaction" ALTER COLUMN "total_transaction_amount" TYPE numeric(16,4)`
    );
  }
}
