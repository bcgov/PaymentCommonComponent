import {
  Entity,
  Unique,
  Column,
  OneToMany,
  Relation,
  PrimaryColumn,
} from 'typeorm';
import { MerchantLocationEntity } from './merchant-location.entity';
import { Merchant, NormalizedLocation } from '../../constants';

@Entity('location')
@Unique(['source_id', 'location_id'])
export class LocationEntity {
  @PrimaryColumn()
  id: string;

  @Column('varchar', { length: 15, nullable: false })
  source_id: string;

  @Column({ type: 'int4', nullable: false })
  location_id: number;

  @Column('varchar', { length: 255, nullable: false })
  description: string;

  @Column('varchar', { length: 10, nullable: false })
  program_code: number;

  @Column('varchar', { length: 255, nullable: false })
  program_desc: string;

  @Column('varchar', { length: 3, nullable: false })
  ministry_client: number;

  @Column('varchar', { length: 5, nullable: false })
  resp_code: string;

  @Column('varchar', { length: 5, nullable: false })
  service_line_code: number;

  @Column('varchar', { length: 4, nullable: false })
  stob_code: number;

  @Column('varchar', { length: 7, nullable: false })
  project_code: number;

  @OneToMany(() => MerchantLocationEntity, (merchant) => merchant.location, {
    nullable: true,
    cascade: true,
  })
  merchant_ids: Relation<MerchantLocationEntity[]>;

  @Column()
  pt_location_id: number;

  constructor(location: NormalizedLocation, merchant_ids: Merchant[]) {
    Object.assign(this, location);
    if (merchant_ids)
      Object.assign(
        this.merchant_ids,
        merchant_ids?.map((merchant) => new MerchantLocationEntity(merchant))
      );
  }
}
