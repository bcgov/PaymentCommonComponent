import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1676663602622 implements MigrationInterface {
  name = 'migration1676663602622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_bc1e7b7438cdc9fa47ccb0e19fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_06455ff0753337e283091035e11"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_69c08e5ceb8b373d3f3f5d3f5b3"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_d7dd0128ba4c6250ed0106bb4dc"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "exceptions_log"`
    );
    await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "deposit_id"`);
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "pos_deposit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "cash_deposit_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "exceptions_log"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "exceptions_log"`
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
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric(16,4)`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" SET NOT NULL`
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
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "exchange_adj_amt" TYPE numeric`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "UQ_e24ee9d4e22bd555c996de2cb14"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "pos_deposit_match"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "cash_deposit_match"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "exceptions_log" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "exceptions_log" integer`
    );
    await queryRunner.query(`ALTER TABLE "payment" ADD "cash_deposit_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "pos_deposit_id" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "deposit_id" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "exceptions_log" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_d7dd0128ba4c6250ed0106bb4dc" FOREIGN KEY ("exceptions_log") REFERENCES "reconciliation_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_69c08e5ceb8b373d3f3f5d3f5b3" FOREIGN KEY ("exceptions_log") REFERENCES "reconciliation_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_06455ff0753337e283091035e11" FOREIGN KEY ("cash_deposit_id") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_bc1e7b7438cdc9fa47ccb0e19fe" FOREIGN KEY ("exceptions_log") REFERENCES "reconciliation_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
