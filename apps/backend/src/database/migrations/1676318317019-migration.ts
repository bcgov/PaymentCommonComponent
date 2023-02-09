import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1676318317019 implements MigrationInterface {
  name = 'migration1676318317019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cash_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI17', "program_code" character varying, "deposit_date" date NOT NULL, "transaction_type" integer NOT NULL, "location_id" integer NOT NULL, "deposit_time" character varying, "seq_no" character varying NOT NULL, "location_desc" character varying NOT NULL, "deposit_amt_curr" numeric(16,4) NOT NULL, "currency" character varying, "exchange_adj_amt" numeric, "deposit_amt_cdn" numeric(16,4) NOT NULL, "destination_bank_no" character varying NOT NULL, "batch_no" character varying, "jv_type" character varying, "jv_no" character varying, "match" boolean NOT NULL DEFAULT false, "cash_payment_ids" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_a116daf4429bfbd5eb71b758ebd" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_431051c2bf263d6c9a4b41c1f60" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "payment_method" ("method" character varying(10) NOT NULL, "description" character varying(50), "sbc_code" character varying(2), CONSTRAINT "PK_463d4c661719685f2dffa48ec9d" PRIMARY KEY ("method"))`
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(16,4) NOT NULL, "currency" character varying, "exchange_rate" numeric(16,4), "channel" character varying, "method" character varying(10) NOT NULL, "card_no" character varying(4), "merchant_id" character varying(25), "device_id" character varying(25), "invoice_no" character varying(25), "tran_id" character varying(25), "order_no" character varying(25), "approval_code" character varying(25), "match" boolean NOT NULL DEFAULT false, "deposit_id" character varying(50), "transaction" character varying, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "transaction" ("transaction_id" character varying NOT NULL, "transaction_date" date NOT NULL, "transaction_time" character varying, "fiscal_close_date" date NOT NULL, "total_payment_amount" numeric(16,4) NOT NULL, "void_indicator" boolean NOT NULL DEFAULT false, "source_id" character varying(10) NOT NULL, "location_id" integer NOT NULL, "transactionJson" jsonb NOT NULL, "migrated" boolean NOT NULL DEFAULT false, "source_file_name" character varying(50), CONSTRAINT "PK_6e02e5a0a6a7400e1c944d1e946" PRIMARY KEY ("transaction_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "pos_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI34', "merchant_id" integer NOT NULL, "card_vendor" character varying NOT NULL, "card_id" character varying NOT NULL, "transaction_amt" numeric(16,4) NOT NULL, "transaction_date" date NOT NULL, "transaction_time" TIME, "terminal_no" character varying NOT NULL, "settlement_date" date, "transaction_code" integer, "match" boolean NOT NULL DEFAULT false, "matched_payment_id" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_19779f7e47915eb226a4857da5e" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_d4ae6a25dcd4e792e1c2292be18" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "master_location_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_id" character varying(15) NOT NULL, "location_id" numeric, "method" character varying(15) NOT NULL, "pt_location_id" numeric NOT NULL, "description" character varying(255) NOT NULL, "program_code" character varying(10) NOT NULL, "program_desc" character varying(255) NOT NULL, "ministry_client" character varying(3) NOT NULL, "resp_code" character varying(5) NOT NULL, "service_line_code" character varying(5) NOT NULL, "stob_code" character varying(4) NOT NULL, "project_code" character varying(7) NOT NULL, "merchant_id" numeric NOT NULL, CONSTRAINT "PK_cba6dfaafb30f4e7fe0572acb73" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9" FOREIGN KEY ("method") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4" FOREIGN KEY ("transaction") REFERENCES "transaction"("transaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" ADD CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5" FOREIGN KEY ("card_vendor") REFERENCES "payment_method"("method") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pos_deposit" DROP CONSTRAINT "FK_da94b177c4411039c15bfc2c6e5"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_1fe3212a0fc1e58f4760f5da8c9"`
    );
    await queryRunner.query(`DROP TABLE "master_location_data"`);
    await queryRunner.query(`DROP TABLE "pos_deposit"`);
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TABLE "payment_method"`);
    await queryRunner.query(`DROP TABLE "cash_deposit"`);
  }
}
