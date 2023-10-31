import {
  Entity,
  ManyToOne,
  Relation,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { MinistryLocationEntity } from './location.entity';

@Entity('location_bank')
export class BankLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bank_id: number;

  @ManyToOne(() => MinistryLocationEntity, (location) => location.banks)
  @JoinColumn({ name: 'location', referencedColumnName: 'id' })
  location: Relation<MinistryLocationEntity>;

  @Column('varchar', { length: 15 })
  method: string;

  constructor(data?: Partial<BankLocationEntity>) {
    Object.assign(this, data);
  }
}
