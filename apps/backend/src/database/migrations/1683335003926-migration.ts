import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1683335003926 implements MigrationInterface {
  name = 'migration1683335003926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" ADD "heuristic_match_round" integer `
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "heuristic_match_round" integer `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "heuristic_match_round"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP COLUMN "heuristic_match_round"`
    );
  }
}
