import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1682047414672 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM master_location_data where pt_location_id=0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO master_location_data ('SBC', 	10, 	'Bank', 	0, 	'BURNABY', 	70, 	'BURNABY', 	74, 	'32L10', 	58200, 	1461,	3200000,	999999999)`
    );
  }
}
