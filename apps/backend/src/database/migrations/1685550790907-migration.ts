import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1685550790907 implements MigrationInterface {
  name = 'migration1685550790907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_round_four_matches_pos_deposit" ("paymentId" uuid NOT NULL, "posDepositId" uuid NOT NULL, CONSTRAINT "PK_d099fc3b96ce39951bae36f4991" PRIMARY KEY ("paymentId", "posDepositId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f06ddb89870cda098fcd4dcb82" ON "payment_round_four_matches_pos_deposit" ("paymentId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70d2cd6ca48dc18df656f23cb5" ON "payment_round_four_matches_pos_deposit" ("posDepositId") `
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" ADD CONSTRAINT "FK_f06ddb89870cda098fcd4dcb822" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" ADD CONSTRAINT "FK_70d2cd6ca48dc18df656f23cb56" FOREIGN KEY ("posDepositId") REFERENCES "pos_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" DROP CONSTRAINT "FK_70d2cd6ca48dc18df656f23cb56"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" DROP CONSTRAINT "FK_f06ddb89870cda098fcd4dcb822"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70d2cd6ca48dc18df656f23cb5"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f06ddb89870cda098fcd4dcb82"`
    );
    await queryRunner.query(
      `DROP TABLE "payment_round_four_matches_pos_deposit"`
    );
  }
}
