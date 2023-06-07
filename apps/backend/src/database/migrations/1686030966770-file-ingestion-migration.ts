import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1686030966770 implements MigrationInterface {
  name = 'file-ingestion-migration1686030966770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "file_ingestion_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "program" character varying NOT NULL, "cashChequesFilename" character varying NOT NULL, "cardsFilename" character varying NOT NULL, "transactionsFilename" character varying NOT NULL, "retries" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_092531b74dee2a92a21d2e1d981" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "program_daily_upload" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "dataDate" date NOT NULL, "success" boolean NOT NULL, "retries" integer NOT NULL, "ruleId" uuid, CONSTRAINT "PK_24196c3558e5e3bf7617a2b453d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "file_uploaded" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "source_file_type" character varying NOT NULL DEFAULT 'TDI17', "source_file_name" character varying NOT NULL, "source_file_length" integer NOT NULL, "programFilesId" uuid, CONSTRAINT "PK_27908e2def3d89bd889a9cd65dd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "file_uploaded" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD "file_uploaded" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD "file_uploaded" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" ADD CONSTRAINT "FK_9f44128650393d73bccc114765b" FOREIGN KEY ("ruleId") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" ADD CONSTRAINT "FK_0aff59d03597f87030b84c868d2" FOREIGN KEY ("programFilesId") REFERENCES "program_daily_upload"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_c90546b2c82635228ccfe411a54" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_17acb8fdfe49332f44ad809be98" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_6da8fc3556db7ef6fe1c9444fb8" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_6da8fc3556db7ef6fe1c9444fb8"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_17acb8fdfe49332f44ad809be98"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_c90546b2c82635228ccfe411a54"`
    );
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" DROP CONSTRAINT "FK_0aff59d03597f87030b84c868d2"`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" DROP CONSTRAINT "FK_9f44128650393d73bccc114765b"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP COLUMN "file_uploaded"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP COLUMN "file_uploaded"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "file_uploaded"`
    );
    await queryRunner.query(`DROP TABLE "file_uploaded"`);
    await queryRunner.query(`DROP TABLE "program_daily_upload"`);
    await queryRunner.query(`DROP TABLE "file_ingestion_rules"`);
  }
}
