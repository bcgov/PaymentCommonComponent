import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698429020745 implements MigrationInterface {
  name = 'Migration1698429020745';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchant_id" TO "merchant"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "location_id"`
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "location" integer`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(15)`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "bank" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_ed3bc7770e06227118469aaec61" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_0c2d1a0d19b5b5ea5f0af5f3bf2" FOREIGN KEY ("merchant") REFERENCES "location_merchant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_0889fcbcebfdf2845d242627936" FOREIGN KEY ("bank") REFERENCES "location_bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_0889fcbcebfdf2845d242627936"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_0c2d1a0d19b5b5ea5f0af5f3bf2"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_ed3bc7770e06227118469aaec61"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "bank" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ALTER COLUMN "merchant" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(10) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "location"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "location_id" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "bank" TO "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "merchant" TO "merchant_id"`
    );
  }
}
