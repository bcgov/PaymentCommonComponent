import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1679690933840 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM master_location_data where pt_location_id=20019`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO master_location_data('SBC', 	19,	'Bank',	20019,	'CHETWYND',	70, 	'SERVICE BC', 	74,	'32H19', 	58200,	1461,	3200000,	999999999)`
    );
  }
}
