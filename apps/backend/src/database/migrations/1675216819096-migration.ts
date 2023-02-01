import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1675216819096 implements MigrationInterface {
  name = 'migration1675216819096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cash_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI17', "program_code" character varying, "deposit_date" date NOT NULL, "transaction_type" integer NOT NULL, "location_id" integer NOT NULL, "deposit_time" character varying, "seq_no" character varying NOT NULL, "location_desc" character varying NOT NULL, "deposit_amt_curr" numeric NOT NULL, "currency" character varying, "exchange_adj_amt" numeric, "deposit_amt_cdn" numeric NOT NULL, "destination_bank_no" character varying NOT NULL, "batch_no" character varying, "jv_type" character varying, "jv_no" character varying, "match" boolean NOT NULL DEFAULT false, "cash_payment_ids" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_a116daf4429bfbd5eb71b758ebd" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_431051c2bf263d6c9a4b41c1f60" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "pos_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI34', "merchant_id" integer NOT NULL, "card_vendor" character varying NOT NULL, "card_id" character varying NOT NULL, "transaction_amt" numeric NOT NULL, "transaction_date" date NOT NULL, "transaction_time" TIME, "terminal_no" character varying NOT NULL, "settlement_date" date, "transaction_code" integer, "match" boolean NOT NULL DEFAULT false, "matched_payment_id" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_19779f7e47915eb226a4857da5e" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_d4ae6a25dcd4e792e1c2292be18" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "method" integer NOT NULL, "amount" numeric NOT NULL, "currency" character varying, "exchange_rate" numeric, "match" boolean NOT NULL DEFAULT false, "pos_deposit_id" character varying, "transaction" uuid, "cash_deposit_id" uuid, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" character varying NOT NULL, "transaction_date" date NOT NULL, "fiscal_date" date NOT NULL, "transaction_time" character varying, "payment_total" numeric NOT NULL, "location_id" integer NOT NULL, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4" FOREIGN KEY ("transaction") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_06455ff0753337e283091035e11" FOREIGN KEY ("cash_deposit_id") REFERENCES "cash_deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_06455ff0753337e283091035e11"`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4"`
    );
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TABLE "pos_deposit"`);
    await queryRunner.query(`DROP TABLE "cash_deposit"`);
  }
}
