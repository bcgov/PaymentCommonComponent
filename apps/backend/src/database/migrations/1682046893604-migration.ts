import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1682046893604 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM public.payment_method WHERE method = 'MV'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT into public.payment_method (method, description, sbc_code, classification) VALUES ('MV', 'MASTERCARD_DEBIT', 19, 'POS')`
    );
  }
}
