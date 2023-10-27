import {
  Entity,
  ManyToOne,
  JoinColumn,
  Relation,
  Unique,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { LocationEntity } from './location.entity';

@Entity('location_bank')
@Unique('id', ['id', 'location'])
@Index('id_location_idx', ['id', 'location'], { unique: true })
export class BankLocationEntity {
  @PrimaryColumn({ unique: true })
  id: number;

  @ManyToOne(() => LocationEntity, (location) => location.banks)
  @JoinColumn({ name: 'location', referencedColumnName: 'location_id' })
  @JoinColumn({ name: 'source_id', referencedColumnName: 'source_id' })
  location: Relation<LocationEntity>;

  constructor(data?: Partial<BankLocationEntity>) {
    Object.assign(this, data);
  }
}
