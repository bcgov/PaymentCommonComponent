import { MasterLocationDataEntity } from './entities/master-location-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ILocation } from './interface/location.interface';
//TODO
// enum LocationEnum {
//   Bank = 'Bank'
// }

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(MasterLocationDataEntity)
    private locationRepo: Repository<MasterLocationDataEntity>
  ) {}

  public async getMerchantIdsByLocationId(
    location_id: number
  ): Promise<number[]> {
    //TODO
    // const merchant_ids = await this.locationRepo.find({
    //   where: {
    //     'GARMS Location': location_id,
    //     Type: Not(LocationEnum.Bank)
    //   }
    // });

    // return merchant_ids?.map((location: MasterLocationDataEntity) =>
    //   parseInt(location['Merchant ID'])
    // );
    const merchant_ids = await this.locationRepo.manager.query(`
    SELECT DISTINCT "Merchant ID" 
    FROM public.master_location_data ml 
    WHERE ml."GARMS Location" = ${location_id} 
    AND "Type" != 'Bank'
  `);
    return merchant_ids.map((itm: any) => parseInt(itm['Merchant ID']));
  }

  public async getPTIDs(location_id: number): Promise<number[]> {
    const pt_ids = await this.locationRepo.find({
      select: { Location: true },
      where: {
        'GARMS Location': location_id
      }
    });
    return pt_ids?.map((itm: MasterLocationDataEntity) => itm['Location']);
  }

  public async getLocationList(): Promise<Partial<ILocation>[]> {
    //TODO
    // const locations = await this.locationRepo.find({
    //   select: { 'GARMS Location': true, description: true },
    //   where: {
    //     Type: LocationEnum.Bank
    //   },
    //   order: {
    //     'GARMS Location': 'DESC'
    //   }
    // });
    // return (
    //   locations &&
    //   locations.map((itm: MasterLocationDataEntity) => ({
    //     sbc_location: itm['GARMS Location'],
    //     office_name: itm.description
    //   }))
    // );
    const locations = await this.locationRepo.manager.query(`
        SELECT "GARMS Location", description 
        FROM public.master_location_data ml 
        WHERE ml."Type" = 'Bank' 
        ORDER BY "GARMS Location" DESC;
      `);
    return locations.map((itm: any) => ({
      sbc_location: itm['GARMS Location'],
      office_name: itm.description
    }));
  }

  public async getLocationByGARMSLocationID(
    location_id: number
  ): Promise<Partial<ILocation>> {
    try {
      const location = (await this.getLocationList()).find(
        (location: Partial<ILocation>) => location.sbc_location === location_id
      );
      if (location) {
        return location;
      } else {
        throw new Error('Location not found');
      }
    } catch (err) {
      throw err;
    }
  }
}
