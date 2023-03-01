import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677697814581 implements MigrationInterface {
  name = 'migration1677697814581';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "payment" 
        ADD "foreign_currency_amount" numeric(16,4)        
    `);

    await queryRunner.query(`
        UPDATE payment
        SET foreign_currency_amount=amount
        WHERE currency !='CAD'
        
    `);

    await queryRunner.query(`
        UPDATE payment
        SET amount=amount*(exchange_rate/100)
        WHERE currency !='CAD'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE payment
        SET amount=amount/(exchange_rate/100)
        WHERE currency !='CAD'
    `);

    await queryRunner.query(`
        UPDATE payment
        SET foreign_currency_amount=null
        WHERE method!='CAD'
    `);

    await queryRunner.query(`
        ALTER TABLE "payment" 
        DROP COLUMN "foreign_currency_amount"
    `);
  }
}
