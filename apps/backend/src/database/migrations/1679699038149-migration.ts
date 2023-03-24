import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1679699038149 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO master_location_data
        (id, source_id, location_id, "method", pt_location_id, description, program_code, program_desc, ministry_client, resp_code, service_line_code, stob_code, project_code, merchant_id)


      VALUES(uuid_generate_v4(), 'SBC', 10, 'Bank', 0, 'BURNABY', '70', 'BURNABY', '74', '32L10', '58200', '1461', '3200000', 999999999);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM master_location_data where location_id=10 and method='Bank'`
    );
  }
}
