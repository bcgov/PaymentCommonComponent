import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LocationEntity } from './entities/master-location-data.entity';
import { ILocation } from './interface/location.interface';
import { LocationEnum } from './const';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private locationRepo: Repository<LocationEntity>
  ) {}

  public async getPTLocdByGarmsLocId(location_id: number): Promise<number[]> {
    const pt_ids = await this.locationRepo.find({
      select: { location_id: true },
      where: {
        location_id: location_id
      }
    });
    return pt_ids?.map((itm: LocationEntity) => itm.location_id);
  }

  public async getSBCLocationIDsAndOfficeList(): Promise<Partial<ILocation>[]> {
    const locations = await this.locationRepo.find({
      select: {
        location_id: true,
        description: true
      },
      where: {
        type: `${LocationEnum.Bank}`,
        source_id: 'SBC'
      }
    });

    return (
      locations &&
      locations.map((itm: Partial<LocationEntity>) => ({
        location_id: itm.location_id,
        office_name: itm.description
      }))
    );
  }

  public async getLocationByGARMSLocationID(
    location_id: number
  ): Promise<Partial<ILocation>> {
    try {
      const location = (await this.getSBCLocationIDsAndOfficeList()).find(
        (location: Partial<ILocation>) => location.location_id === location_id
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
