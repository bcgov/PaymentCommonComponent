import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1686207492088 implements MigrationInterface {
  name = 'filenames-rules-migration1686207492088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO file_ingestion_rules(program, cash_cheques_filename, pos_filename, transactions_filename, retries) VALUES ('SBC', 'F08TDI17', 'F08TDI34', 'SBC_SALES', 2)`
    );

    await queryRunner.query(
      `INSERT INTO file_ingestion_rules(program, cash_cheques_filename, pos_filename, transactions_filename, retries) VALUES ('LABOUR', 'F08TDI17', 'F08TDI34', null, 2)`
    );

    await queryRunner.query(
      `INSERT INTO file_uploaded ("source_file_type", "source_file_name", "source_file_length") SELECT 'SBC_SALES' as source_file_type, source_file_name, count(*) as source_file_length FROM transaction WHERE file_uploaded IS NULL GROUP BY source_file_name`
    );

    await queryRunner.query(
      `INSERT INTO file_uploaded ("source_file_type", "source_file_name", "source_file_length") SELECT 'TDI17' as source_file_type, source_file_name, source_file_length FROM cash_deposit WHERE file_uploaded IS NULL GROUP BY source_file_name, source_file_length`
    );

    await queryRunner.query(
      `INSERT INTO file_uploaded ("source_file_type", "source_file_name", "source_file_length") SELECT 'TDI34' as source_file_type, source_file_name, source_file_length FROM pos_deposit WHERE file_uploaded IS NULL GROUP BY source_file_name, source_file_length`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM file_uploaded WHERE daily_upload_id IS NULL`
    );

    await queryRunner.query(
      `DELETE FROM file_ingestion_rules WHERE program IN ('SBC', 'LABOUR')`
    );
  }
}
