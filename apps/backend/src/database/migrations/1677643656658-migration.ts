import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1677643656658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`        
        UPDATE pos_deposit
        SET transaction_amt = transaction_amt * -1    
        WHERE transaction_amt > 0 
        AND transaction_code = 14
        OR transaction_code = 21
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`        
        UPDATE pos_deposit
        SET transaction_amt = transaction_amt * -1    
        WHERE transaction_amt < 0 
        AND transaction_code = 14
        OR transaction_code = 21
    `);
  }
}
