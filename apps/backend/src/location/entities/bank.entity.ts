import {
    Entity,
    ManyToOne,
    Relation,
    JoinColumn,
    PrimaryColumn,
  } from 'typeorm';
  import { MinistryLocationEntity } from './location.entity';
  
  @Entity('location_bank')
  export class BankLocationEntity {
    @PrimaryColumn({ unique: true })
    id: number;
  
    @ManyToOne(() => MinistryLocationEntity, (location) => location.banks)
    @JoinColumn({ name: 'location', referencedColumnName: 'id' })
    location: Relation<MinistryLocationEntity>;
  
    constructor(data?: Partial<BankLocationEntity>) {
      Object.assign(this, data);
    }
  }
  