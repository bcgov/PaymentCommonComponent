import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1689666205003 implements MigrationInterface {
  name = 'rquired-files-migration1689635953535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "program_required_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "filename" character varying NOT NULL, "file_type" character varying NOT NULL, "rule_id" uuid, CONSTRAINT "PK_6f2e3955cb6b01f1e2ff4e124bf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" DROP COLUMN "cash_cheques_filename"`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" DROP COLUMN "transactions_filename"`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" DROP COLUMN "pos_filename"`
    );
    await queryRunner.query(
      `ALTER TABLE "program_required_file" ADD CONSTRAINT "FK_accca5c473c9b3b0a0f777aaae8" FOREIGN KEY ("rule_id") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`
      INSERT INTO program_required_file (filename, file_type, rule_id) VALUES
      ('F08TDI17', 'TDI17', (SELECT id FROM file_ingestion_rules WHERE program = 'SBC')),
      ('F08TDI34', 'TDI34', (SELECT id FROM file_ingestion_rules WHERE program = 'SBC')),
      ('SBC_SALES', 'SBC_SALES', (SELECT id FROM file_ingestion_rules WHERE program = 'SBC')),
      ('F08TDI17', 'TDI17', (SELECT id FROM file_ingestion_rules WHERE program = 'LABOUR')),
      ('F08TDI34', 'TDI34', (SELECT id FROM file_ingestion_rules WHERE program = 'LABOUR'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_required_file" DROP CONSTRAINT "FK_accca5c473c9b3b0a0f777aaae8"`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" ADD "pos_filename" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" ADD "transactions_filename" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "file_ingestion_rules" ADD "cash_cheques_filename" character varying`
    );
    await queryRunner.query(`DROP TABLE "program_required_file"`);
    await queryRunner.query(
      `UPDATE file_ingestion_rules SET cash_cheques_filename='F08TDI17', pos_filename='F08TDI34', transactions_filename='SBC_SALES' WHERE program = 'SBC';`
    );
    await queryRunner.query(
      `UPDATE file_ingestion_rules SET cash_cheques_filename='F08TDI17', pos_filename='F08TDI34'  WHERE program = 'LABOUR';`
    );
  }
}
