import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1697740818695 implements MigrationInterface {
  name = 'Migration1697740818695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_dc1325b0728d42d34c822a06e68"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "location_bank" TO "pt_location_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_346127033e9c6ca7ffa2df9ecbf"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_62c907775331b5aa98ec8daf7dd" PRIMARY KEY ("location_id", "source_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "method" character varying(15)`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "pt_location_id" integer`
    );
    await queryRunner.query(`ALTER TABLE "location" ADD "merchant_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "method" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_62c907775331b5aa98ec8daf7dd"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_493e447ab3910ba8641693df0fc" PRIMARY KEY ("location_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_493e447ab3910ba8641693df0fc"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("location_id", "source_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("location_id", "source_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("source_id", "location_id") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_71b298e334812703ac318c4f255" FOREIGN KEY ("pt_location_id") REFERENCES "location_bank"("pt_location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_71b298e334812703ac318c4f255"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_48140a4e95790e677ba9459d11f"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" DROP CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36"`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" DROP CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf"`
    );
    await queryRunner.query(`DROP INDEX "public"."location_source_idx"`);
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_493e447ab3910ba8641693df0fc" PRIMARY KEY ("location_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_493e447ab3910ba8641693df0fc"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_62c907775331b5aa98ec8daf7dd" PRIMARY KEY ("location_id", "source_id", "id")`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("source_id", "location_id")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "location_source_idx" ON "location" ("source_id", "location_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_48140a4e95790e677ba9459d11f" FOREIGN KEY ("source_id", "location_id") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_merchant" ADD CONSTRAINT "FK_b87ce3ff7ef49fe37473a2b0d36" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "location_bank" ADD CONSTRAINT "FK_3f0244485c6ed7cff769eb7f06f" FOREIGN KEY ("source_id", "location") REFERENCES "location"("source_id","location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "merchant_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "method" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "merchant_id"`);
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "pt_location_id"`
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "method"`);
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "PK_62c907775331b5aa98ec8daf7dd"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "PK_346127033e9c6ca7ffa2df9ecbf" PRIMARY KEY ("location_id", "source_id")`
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" RENAME COLUMN "pt_location_id" TO "location_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_dc1325b0728d42d34c822a06e68" FOREIGN KEY ("location_bank") REFERENCES "location_bank"("pt_location_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
