import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697684399040 implements MigrationInterface {
  name = 'Migration1697684399040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_dd423da8b6167163d79d3c06953"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_71b298e334812703ac318c4f255"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_346127033e9c6ca7ffa2df9ecb"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "location_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827"`
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "location"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_346127033e9c6ca7ffa2df9ecbf" PRIMARY KEY ("source_id", "location_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(15)`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "location_bank" DROP NOT NULL`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("location_id", "source_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("source_id", "location_id") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_dc1325b0728d42d34c822a06e68" FOREIGN KEY ("location_bank") REFERENCES "location_bank"("pt_location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_dc1325b0728d42d34c822a06e68"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ALTER COLUMN "location_bank" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "location_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "source_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "source_id" character varying(10) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_346127033e9c6ca7ffa2df9ecbf"`
    );
    await queryRunner.query(`ALTER TABLE "transaction" ADD "location" uuid`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "location_bank" TO "pt_location_id"`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_346127033e9c6ca7ffa2df9ecb" ON "location" ("source_id", "location_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_71b298e334812703ac318c4f255" FOREIGN KEY ("pt_location_id") REFERENCES "location_bank"("pt_location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_dd423da8b6167163d79d3c06953" FOREIGN KEY ("location") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
