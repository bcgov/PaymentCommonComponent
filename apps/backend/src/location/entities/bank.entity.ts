import {
  Entity,
  ManyToOne,
  JoinColumn,
  Relation,
  PrimaryColumn,
} from 'typeorm';
import { LocationEntity } from './location.entity';

@Entity('location_bank')
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
