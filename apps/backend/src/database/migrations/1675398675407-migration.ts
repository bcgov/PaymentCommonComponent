import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1675398675407 implements MigrationInterface {
    name = 'migration1675398675407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "master_location_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "GARMS Location" integer, "Type" character varying, "Location" integer, "description" character varying, "Program" integer, "Program Description" character varying, "Min Client" integer, "Responsibility Code" character varying, "Service Line" integer, "stob" integer, "Project No." integer, "Merchant ID" character varying, "notes" character varying, CONSTRAINT "PK_cba6dfaafb30f4e7fe0572acb73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cash_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI17', "program_code" character varying, "deposit_date" date NOT NULL, "transaction_type" integer NOT NULL, "location_id" integer NOT NULL, "deposit_time" character varying, "seq_no" character varying NOT NULL, "location_desc" character varying NOT NULL, "deposit_amt_curr" numeric NOT NULL, "currency" character varying, "exchange_adj_amt" numeric, "deposit_amt_cdn" numeric NOT NULL, "destination_bank_no" character varying NOT NULL, "batch_no" character varying, "jv_type" character varying, "jv_no" character varying, "match" boolean NOT NULL DEFAULT false, "cash_payment_ids" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_a116daf4429bfbd5eb71b758ebd" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_431051c2bf263d6c9a4b41c1f60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pos_deposit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_file_type" character varying NOT NULL DEFAULT 'TDI34', "merchant_id" integer NOT NULL, "card_vendor" character varying NOT NULL, "card_id" character varying NOT NULL, "transaction_amt" numeric NOT NULL, "transaction_date" date NOT NULL, "transaction_time" TIME, "terminal_no" character varying NOT NULL, "settlement_date" date, "transaction_code" integer, "match" boolean NOT NULL DEFAULT false, "matched_payment_id" character varying, "date_uploaded" TIMESTAMP NOT NULL DEFAULT now(), "program" character varying, "source_file_name" character varying, "source_file_line" integer NOT NULL, "source_file_length" integer NOT NULL, CONSTRAINT "UQ_19779f7e47915eb226a4857da5e" UNIQUE ("source_file_name", "source_file_line"), CONSTRAINT "PK_d4ae6a25dcd4e792e1c2292be18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_method" ("method" character varying(10) NOT NULL, "description" character varying(50), "sbc_code" character varying(2), CONSTRAINT "PK_463d4c661719685f2dffa48ec9d" PRIMARY KEY ("method"))`);
        await queryRunner.query(`CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric NOT NULL, "currency" character varying, "exchange_rate" numeric, "channel" character varying, "method" character varying(10) NOT NULL, "card_no" character varying(4), "merchant_id" character varying(25), "device_id" character varying(25), "invoice_no" character varying(25), "tran_id" character varying(25), "order_no" character varying(25), "approval_code" character varying(25), "match" boolean NOT NULL DEFAULT false, "deposit_id" character varying(50), "transaction" character varying, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" character varying NOT NULL, "transaction_date" date NOT NULL, "transaction_time" character varying, "fiscal_close_date" date NOT NULL, "amount" numeric NOT NULL, "void_indicator" boolean NOT NULL DEFAULT false, "source_id" character varying(10) NOT NULL, "location_id" integer NOT NULL, "transactionJson" jsonb NOT NULL, "migrated" boolean NOT NULL DEFAULT false, "source_file_name" character varying(50), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4" FOREIGN KEY ("transaction") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_791b8ba36efbc1f7de35a95a2d4"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TABLE "payment_method"`);
        await queryRunner.query(`DROP TABLE "pos_deposit"`);
        await queryRunner.query(`DROP TABLE "cash_deposit"`);
        await queryRunner.query(`DROP TABLE "master_location_data"`);
    }

}
