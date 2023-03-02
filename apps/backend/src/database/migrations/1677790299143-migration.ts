import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677790299143 implements MigrationInterface {
  name = 'migration1677790299143';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE pos_deposit DROP column "match"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE pos_deposit ADD column "match" Boolean default = false`
    );
  }
}
