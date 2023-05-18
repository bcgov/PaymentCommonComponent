import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1684273295940 implements MigrationInterface {
  name = 'migration1684273295940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_heuristic_match_round_enum" AS ENUM('ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "heuristic_match_round" "public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "heuristic_match_round" "public"."payment_heuristic_match_round_enum"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "heuristic_match_round"`
    );

    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "heuristic_match_round"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "heuristic_match_round" integer`
    );
  }
}
