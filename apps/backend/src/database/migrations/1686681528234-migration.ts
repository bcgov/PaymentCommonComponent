import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1686681528234 implements MigrationInterface {
  name = 'migration1686681528234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" ALTER COLUMN "source_file_type" DROP DEFAULT`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" ALTER COLUMN "source_file_type" SET DEFAULT 'TDI17'`
    );
  }
}
