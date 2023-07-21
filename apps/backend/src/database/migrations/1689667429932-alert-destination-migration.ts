import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1689667429932 implements MigrationInterface {
  name = 'alert-destination-migration1689667429932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alert_destination" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_date" TIMESTAMP NOT NULL DEFAULT now(), "all_alerts" boolean NOT NULL DEFAULT false, "destination" character varying NOT NULL, "rule_id" uuid, "required_file_id" uuid, CONSTRAINT "PK_71f411b94831464a936bf1a3fca" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" ADD CONSTRAINT "FK_1fe83748519ab39a7ce4ce1846d" FOREIGN KEY ("rule_id") REFERENCES "file_ingestion_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" ADD CONSTRAINT "FK_544c33cad3b1b1e062968523a77" FOREIGN KEY ("required_file_id") REFERENCES "program_required_file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_destination" DROP CONSTRAINT "FK_544c33cad3b1b1e062968523a77"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_destination" DROP CONSTRAINT "FK_1fe83748519ab39a7ce4ce1846d"`
    );
    await queryRunner.query(`DROP TABLE "alert_destination"`);
  }
}
