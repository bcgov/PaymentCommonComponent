import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1674455627553 implements MigrationInterface {
  name = 'migration1674455627553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.pos_deposit ALTER COLUMN transaction_date TYPE date USING transaction_date::date;`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_time" type TIME USING "transaction_time"::time;`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN settlement_date TYPE date USING settlement_date::date;`
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN transaction_date TYPE date USING transaction_date::date;`
    );

    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN deposit_date TYPE date USING deposit_date::date;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN deposit_date TYPE timestamp USING  deposit_date::timestamp;`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN transaction_date TYPE timestamp USING  transaction_date::timestamp;`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN settlement_date TYPE timestamp USING  settlement_date::timestamp;`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN transaction_date TYPE timestamp USING  transaction_date::timestamp;`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "transaction_time" TYPE character varying USING "transaction_time"::character varying;`
    );
  }
}
