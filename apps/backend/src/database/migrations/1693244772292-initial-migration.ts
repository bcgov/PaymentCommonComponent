import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1693244772292 implements MigrationInterface {
  name = 'Migration1693244772292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "program_required_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "filename" character varying NOT NULL, "file_type" character varying NOT NULL, "rule_id" uuid, CONSTRAINT "PK_6f2e3955cb6b01f1e2ff4e124bf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "file_ingestion_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "program" character varying NOT NULL, CONSTRAINT "PK_092531b74dee2a92a21d2e1d981" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "program_daily_upload" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "daily_date" date NOT NULL, "success" boolean NOT NULL, "ruleId" uuid, CONSTRAINT "PK_24196c3558e5e3bf7617a2b453d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "file_uploaded" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "source_file_type" character varying NOT NULL, "source_file_name" character varying NOT NULL, "source_file_length" integer NOT NULL, "daily_upload_id" uuid, CONSTRAINT "PK_27908e2def3d89bd889a9cd65dd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method_classification_enum" AS ENUM('CASH', 'POS', 'IGNORE')`
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method" ("method" character varying(10) NOT NULL, "description" character varying(50), "sbc_code" integer, "classification" "public"."payment_method_classification_enum", CONSTRAINT "PK_463d4c661719685f2dffa48ec9d" PRIMARY KEY ("method"))`
    );
    await queryRunner.query(
      `CREATE TABLE "transaction" ("transaction_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "parsed_on" date, "transaction_date" date NOT NULL, "transaction_time" TIME, "fiscal_close_date" date NOT NULL, "total_transaction_amount" numeric(16,2) NOT NULL, "void_indicator" boolean NOT NULL DEFAULT false, "source_id" character varying(10) NOT NULL, "location_id" integer NOT NULL, "transactionJson" jsonb NOT NULL, "migrated" boolean NOT NULL DEFAULT false, "source_file_name" character varying(50), "file_uploaded" uuid, CONSTRAINT "PK_6e02e5a0a6a7400e1c944d1e946" PRIMARY KEY ("transaction_id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pos_deposit_heuristic_match_round_enum" AS ENUM('ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `CREATE TABLE "pos_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reconciled_on" TIMESTAMP, "in_progress_on" TIMESTAMP, "status" "public"."pos_deposit_status_enum" NOT NULL DEFAULT 'PENDING', "source_file_type" character varying NOT NULL DEFAULT 'TDI34', "merchant_id" integer NOT NULL, "card_id" character varying(19) NOT NULL, "transaction_amt" numeric(16,2) NOT NULL, "transaction_date" date NOT NULL, "transaction_time" TIME, "terminal_no" character varying(19) NOT NULL, "settlement_date" date, "transaction_code" integer, "heuristic_match_round" "public"."pos_deposit_heuristic_match_round_enum", "file_uploaded" uuid, "payment_method" character varying(10), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "parsed_on" date, "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_19779f7e47915eb226a4857da5e" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_d4ae6a25dcd4e792e1c2292be18" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_heuristic_match_round_enum" AS ENUM('ONE', 'TWO', 'THREE', 'FOUR')`
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reconciled_on" TIMESTAMP, "in_progress_on" TIMESTAMP, "amount" numeric(16,2) NOT NULL, "foreign_currency_amount" numeric(16,2), "currency" character varying(3) NOT NULL DEFAULT 'CAD', "exchange_rate" numeric(16,4), "channel" character varying, "status" "public"."payment_status_enum" NOT NULL DEFAULT 'PENDING', "card_no" character varying(4), "merchant_id" character varying(25), "device_id" character varying(25), "invoice_no" character varying(25), "tran_id" character varying(25), "order_no" character varying(25), "approval_code" character varying(25), "heuristic_match_round" "public"."payment_heuristic_match_round_enum", "payment_method" character varying(10), "transaction" character varying, "cash_deposit_match" uuid, "pos_deposit_match" uuid, CONSTRAINT "REL_e24ee9d4e22bd555c996de2cb1" UNIQUE ("pos_deposit_match"), CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cash_deposit_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'MATCH', 'EXCEPTION')`
    );
    await queryRunner.query(
      `CREATE TABLE "cash_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reconciled_on" TIMESTAMP, "in_progress_on" TIMESTAMP, "source_file_type" character varying NOT NULL DEFAULT 'TDI17', "program_code" character varying, "deposit_date" date NOT NULL, "pt_location_id" integer NOT NULL, "deposit_time" TIME, "seq_no" character varying(3) NOT NULL, "location_desc" character varying(40) NOT NULL, "deposit_amt_curr" numeric(16,2) NOT NULL, "currency" character varying, "exchange_adj_amt" numeric(16,2) NOT NULL, "deposit_amt_cdn" numeric(16,2) NOT NULL, "destination_bank_no" character varying(4) NOT NULL, "batch_no" character varying, "jv_type" character varying, "jv_no" character varying, "status" "public"."cash_deposit_status_enum" NOT NULL DEFAULT 'PENDING', "file_uploaded" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "parsed_on" date, "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_a116daf4429bfbd5eb71b758ebd" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_431051c2bf263d6c9a4b41c1f60" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "master_location_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_id" character varying(15) NOT NULL, "location_id" integer NOT NULL, "method" character varying(15) NOT NULL, "pt_location_id" integer, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, "merchant_id" integer NOT NULL, CONSTRAINT "PK_cba6dfaafb30f4e7fe0572acb73" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "alert_destination" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_date" TIMESTAMP NOT NULL DEFAULT now(), "all_alerts" boolean NOT NULL DEFAULT false, "destination" character varying NOT NULL, "rule_id" uuid, "required_file_id" uuid, CONSTRAINT "PK_71f411b94831464a936bf1a3fca" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "payment_round_four_matches_pos_deposit" ("paymentId" uuid NOT NULL, "posDepositId" uuid NOT NULL, CONSTRAINT "PK_d099fc3b96ce39951bae36f4991" PRIMARY KEY ("paymentId", "posDepositId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f06ddb89870cda098fcd4dcb82" ON "payment_round_four_matches_pos_deposit" ("paymentId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70d2cd6ca48dc18df656f23cb5" ON "payment_round_four_matches_pos_deposit" ("posDepositId") `
    );
    await queryRunner.query(
      `ALTER TABLE "program_required_file" ADD CONSTRAINT "FK_accca5c473c9b3b0a0f777aaae8" FOREIGN KEY ("rule_id") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" ADD CONSTRAINT "FK_9f44128650393d73bccc114765b" FOREIGN KEY ("ruleId") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" ADD CONSTRAINT "FK_179764f9a5f145fa004dd93c9d0" FOREIGN KEY ("daily_upload_id") REFERENCES "program_daily_upload"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_c90546b2c82635228ccfe411a54" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_48f444a8f43995a22bb1df1c391" FOREIGN KEY ("payment_method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_17acb8fdfe49332f44ad809be98" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_b0fd39617223590e14497678eb4" FOREIGN KEY ("payment_method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4" FOREIGN KEY ("transaction") REFERENCES "transaction"("transaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_581f9ad963cae8659e17496269d" FOREIGN KEY ("cash_deposit_match") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_e24ee9d4e22bd555c996de2cb14" FOREIGN KEY ("pos_deposit_match") REFERENCES "pos_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" ADD CONSTRAINT "FK_6da8fc3556db7ef6fe1c9444fb8" FOREIGN KEY ("file_uploaded") REFERENCES "file_uploaded"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" ADD CONSTRAINT "FK_1fe83748519ab39a7ce4ce1846d" FOREIGN KEY ("rule_id") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" ADD CONSTRAINT "FK_544c33cad3b1b1e062968523a77" FOREIGN KEY ("required_file_id") REFERENCES "program_required_file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" ADD CONSTRAINT "FK_f06ddb89870cda098fcd4dcb822" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" ADD CONSTRAINT "FK_70d2cd6ca48dc18df656f23cb56" FOREIGN KEY ("posDepositId") REFERENCES "pos_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" DROP CONSTRAINT "FK_70d2cd6ca48dc18df656f23cb56"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment_round_four_matches_pos_deposit" DROP CONSTRAINT "FK_f06ddb89870cda098fcd4dcb822"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" DROP CONSTRAINT "FK_544c33cad3b1b1e062968523a77"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" DROP CONSTRAINT "FK_1fe83748519ab39a7ce4ce1846d"`
    );
    await queryRunner.query(
      `ALTER TABLE "cash_deposit" DROP CONSTRAINT "FK_6da8fc3556db7ef6fe1c9444fb8"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_e24ee9d4e22bd555c996de2cb14"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_581f9ad963cae8659e17496269d"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_b0fd39617223590e14497678eb4"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_17acb8fdfe49332f44ad809be98"`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_48f444a8f43995a22bb1df1c391"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_c90546b2c82635228ccfe411a54"`
    );
    await queryRunner.query(
      `ALTER TABLE "file_uploaded" DROP CONSTRAINT "FK_179764f9a5f145fa004dd93c9d0"`
    );
    await queryRunner.query(
      `ALTER TABLE "program_daily_upload" DROP CONSTRAINT "FK_9f44128650393d73bccc114765b"`
    );
    await queryRunner.query(
      `ALTER TABLE "program_required_file" DROP CONSTRAINT "FK_accca5c473c9b3b0a0f777aaae8"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70d2cd6ca48dc18df656f23cb5"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f06ddb89870cda098fcd4dcb82"`
    );
    await queryRunner.query(
      `DROP TABLE "payment_round_four_matches_pos_deposit"`
    );
    await queryRunner.query(`DROP TABLE "alert_destination"`);
    await queryRunner.query(`DROP TABLE "master_location_data"`);
    await queryRunner.query(`DROP TABLE "cash_deposit"`);
    await queryRunner.query(`DROP TYPE "public"."cash_deposit_status_enum"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_heuristic_match_round_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
    await queryRunner.query(`DROP TABLE "pos_deposit"`);
    await queryRunner.query(
      `DROP TYPE "public"."pos_deposit_heuristic_match_round_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."pos_deposit_status_enum"`);
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TABLE "payment_method"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_method_classification_enum"`
    );
    await queryRunner.query(`DROP TABLE "file_uploaded"`);
    await queryRunner.query(`DROP TABLE "program_daily_upload"`);
    await queryRunner.query(`DROP TABLE "file_ingestion_rules"`);
    await queryRunner.query(`DROP TABLE "program_required_file"`);
  }
}
