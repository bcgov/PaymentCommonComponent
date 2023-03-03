import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677866567491 implements MigrationInterface {
  name = 'migration1677866567491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `update cash_deposit set deposit_time=null where length(deposit_time) < 4`
    );
    await queryRunner.query(
      `update cash_deposit set deposit_time=concat(LEFT(deposit_time::varchar, 2), RIGHT(deposit_time::varchar, 2),  '00') where deposit_time is not null`
    );

    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" TYPE character varying(3)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_time" TYPE TIME using deposit_time::TIME;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "deposit_time" TYPE character varying(255) using deposit_time::varchar;`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" TYPE character varying(255)`
    );

    await queryRunner.query(
      `update cash_deposit set deposit_time=LEFT(deposit_time::varchar, 4) where deposit_time is not null`
    );

    await queryRunner.query(
      `update cash_deposit set deposit_time=undefined where deposit_time is null`
    );
  }
}
