import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1684272812264 implements MigrationInterface {
  name = 'migration1684272812264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "heuristic_match_round"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_heuristic_match_round_enum" AS ENUM('ONE', 'TWO', 'THREE')`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "heuristic_match_round" "public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "heuristic_match_round"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_heuristic_match_round_enum" AS ENUM('ONE', 'TWO', 'THREE')`
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
      `DROP TYPE "public"."payment_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "heuristic_match_round" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "heuristic_match_round"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "heuristic_match_round" integer`
    );
  }
}
