import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698348111868 implements MigrationInterface {
  name = 'Migration1698348111868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_62c907775331b5aa98ec8daf7dd" UNIQUE ("id", "location_id", "source_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_62c907775331b5aa98ec8daf7dd"`
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_346127033e9c6ca7ffa2df9ecbf" UNIQUE ("source_id", "location_id")`
    );
  }
}
