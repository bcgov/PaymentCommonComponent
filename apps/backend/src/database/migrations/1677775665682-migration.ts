import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677775665682 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM PAYMENT WHERE AMOUNT = 0::numeric;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM PAYMENT WHERE AMOUNT = 0::numeric;
    `);
  }
}
