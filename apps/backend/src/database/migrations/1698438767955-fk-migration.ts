import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698438767955 implements MigrationInterface {
  name = 'FKMigration1698438767955';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("location_id", "source_id") REFERENCES "location"("location_id","source_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
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
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
  }
}
