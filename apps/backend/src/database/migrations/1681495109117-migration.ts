import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1681495109117 implements MigrationInterface {
  name = 'migration1681495109117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "transaction_date" TYPE TIMESTAMP `
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "transaction_time" TYPE TIME USING transaction_time::time without time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "fiscal_close_date" TYPE TIMESTAMP`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_date" TYPE TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_time" TYPE TIME USING transaction_time::time without time zone`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "settlement_date" TYPE TIMESTAMP`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_date" TYPE TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_time" TYPE TIME USING deposit_time::time without time zone`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" TYPE integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "transaction_date" TYPE DATE`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "transaction_time" TYPE varchar(8))`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "fiscal_close_date" TYPE DATE`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_date" TYPE DATE`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_time" TYPE varchar(8))`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "settlement_date" TYPE DATE`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_date" TYPE DATE`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_time" TYPE varchar(8))`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" TYPE integer`
    );
  }
}
