import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as csv from 'csvtojson';
import { LocationEntity } from '../../location/entities';
import { ILocation } from '../../location/interface/location.interface';

export class migration2524636800001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sbcLocationsMasterDataFile = path.resolve(
      __dirname,
      '../../../master_data/locations.csv'
    );
    const sbcLocationMaster = (await csv
      .default()
      .fromFile(sbcLocationsMasterDataFile)) as ILocation[];

    const locationEntities = sbcLocationMaster.map((loc) => {
      return new LocationEntity({ ...loc });
    });

    await queryRunner.manager.save(locationEntities);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM 
                public.master_location_data 
        `);
  }
}
