import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697829309352 implements MigrationInterface {
  name = 'Migration1697829309352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ADD CONSTRAINT "PK_f2c6d2b1367b207377c873ce43d" PRIMARY KEY ("source_id", "location_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("source_id", "location_id") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_aa767c22d7fad98e532a3ff344f" FOREIGN KEY ("merchant_id") REFERENCES "location_merchant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_71b298e334812703ac318c4f255" FOREIGN KEY ("pt_location_id") REFERENCES "location_bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_71b298e334812703ac318c4f255"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_aa767c22d7fad98e532a3ff344f"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" DROP CONSTRAINT "PK_f2c6d2b1367b207377c873ce43d"`
    );
  }
}
