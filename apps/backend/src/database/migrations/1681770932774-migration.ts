import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1681770932774 implements MigrationInterface {
  name = 'migration1681770932774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" RENAME COLUMN "method" TO "payment_method"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "payment_method" DROP NOT NULL`
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
      `ALTER TABLE "payment" ALTER COLUMN "payment_method" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" RENAME COLUMN "payment_method" TO "method"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9" FOREIGN KEY ("method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
