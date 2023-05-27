import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1684995082088 implements MigrationInterface {
  name = 'migration1684995082088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pos_deposit_round_four_payments_payment" ("posDepositId" uuid NOT NULL, "paymentId" uuid NOT NULL, CONSTRAINT "PK_4fa87c6a8f12599702f93ecdffc" PRIMARY KEY ("posDepositId", "paymentId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_185fd13fad611b118fe86fd6b9" ON "pos_deposit_round_four_payments_payment" ("posDepositId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd94566d34ff32f7df537a6609" ON "pos_deposit_round_four_payments_payment" ("paymentId") `
    );
    await queryRunner.query(
      `CREATE TABLE "payment_round_four_deposits_pos_deposit" ("paymentId" uuid NOT NULL, "posDepositId" uuid NOT NULL, CONSTRAINT "PK_98c8b6ec0901469f6d8b56742e9" PRIMARY KEY ("paymentId", "posDepositId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46cb5d64a7beb371f9be04a805" ON "payment_round_four_deposits_pos_deposit" ("paymentId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8376d93767ae274037107d1615" ON "payment_round_four_deposits_pos_deposit" ("posDepositId") `
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit_round_four_payments_payment" ADD CONSTRAINT "FK_185fd13fad611b118fe86fd6b95" FOREIGN KEY ("posDepositId") REFERENCES "pos_deposit"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit_round_four_payments_payment" ADD CONSTRAINT "FK_dd94566d34ff32f7df537a66094" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_deposits_pos_deposit" ADD CONSTRAINT "FK_46cb5d64a7beb371f9be04a805f" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_deposits_pos_deposit" ADD CONSTRAINT "FK_8376d93767ae274037107d1615a" FOREIGN KEY ("posDepositId") REFERENCES "pos_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_deposits_pos_deposit" DROP CONSTRAINT "FK_8376d93767ae274037107d1615a"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_deposits_pos_deposit" DROP CONSTRAINT "FK_46cb5d64a7beb371f9be04a805f"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit_round_four_payments_payment" DROP CONSTRAINT "FK_dd94566d34ff32f7df537a66094"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit_round_four_payments_payment" DROP CONSTRAINT "FK_185fd13fad611b118fe86fd6b95"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8376d93767ae274037107d1615"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46cb5d64a7beb371f9be04a805"`
    );
    await queryRunner.query(
      `DROP TABLE "payment_round_four_deposits_pos_deposit"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd94566d34ff32f7df537a6609"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_185fd13fad611b118fe86fd6b9"`
    );
    await queryRunner.query(
      `DROP TABLE "pos_deposit_round_four_payments_payment"`
    );
  }
}
