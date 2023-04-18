import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1681767646202 implements MigrationInterface {
  name = 'migration1681767646202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_method" ADD "classification" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_method" DROP COLUMN "classification"`
    );
  }
}
