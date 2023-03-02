import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677783207700 implements MigrationInterface {
  name = 'migration1677783207700';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table cash_deposit alter column "location_id" type character varying(5)`
    );
    await queryRunner.query(
      `UPDATE cash_deposit SET location_id = CONCAT('0', location_id) WHERE LENGTH(location_id) = 1`
    );

    await queryRunner.query(
      `UPDATE "cash_deposit" SET "location_id" = (select concat(transaction_type::varchar, location_id::varchar)::varchar)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "transaction_type"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "location_id" TO "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE cash_deposit ALTER COLUMN pt_location_id TYPE integer USING pt_location_id::integer;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE cash_deposit ALTER COLUMN pt_location_id TYPE character varying(5) USING pt_location_id::varchar;`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD COLUMN "transaction_type" character varying(3)`
    );

    await queryRunner.query(
      `UPDATE cash_deposit SET transaction_type = LEFT(location_id, 3)::varchar`
    );
    await queryRunner.query(
      `UPDATE cash_deposit SET location_id = RIGHT(location_id, 2)::varchar`
    );
    await queryRunner.query(
      `ALTER TABLE cash_deposit ALTER COLUMN location_id TYPE integer USING cash_deposit.location_id::integer;`
    );
    await queryRunner.query(
      `ALTER TABLE cash_deposit ALTER COLUMN transaction_type TYPE integer USING cash_deposit.transaction_type::integer;`
    );
  }
}
