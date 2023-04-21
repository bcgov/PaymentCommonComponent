import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1682046634910 implements MigrationInterface {
  name = 'migration1682046634910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "card_vendor" TO "payment_method"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" RENAME COLUMN "method" TO "payment_method"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method_classification_enum" AS ENUM('CASH', 'POS', 'IGNORE')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD "classification" "public"."payment_method_classification_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" DROP COLUMN "sbc_code"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD "sbc_code" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "transaction_time"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "transaction_time" TIME`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "payment_method"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "payment_method" character varying(10)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "payment_method" DROP NOT NULL`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" TYPE integer using pt_location_id::integer`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_48f444a8f43995a22bb1df1c391" FOREIGN KEY ("payment_method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_b0fd39617223590e14497678eb4" FOREIGN KEY ("payment_method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_b0fd39617223590e14497678eb4"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_48f444a8f43995a22bb1df1c391"`
    );

    await queryRunner.query(
      `ALTER TABLE "master_location_data" ALTER COLUMN "pt_location_id" TYPE numeric NOT NULL using pt_location_id::numeric`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "payment_method" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "payment_method"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "payment_method" character varying(2) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "transaction_time"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "transaction_time" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" DROP COLUMN "sbc_code"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD "sbc_code" character varying(2)`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_method" DROP COLUMN "classification"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_method_classification_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" RENAME COLUMN "payment_method" TO "method"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" RENAME COLUMN "payment_method" TO "card_vendor"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9" FOREIGN KEY ("method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
