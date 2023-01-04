import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('location')
export class LocationEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  location_id: number;

  @Column({ type: 'int' })
  merchant_no: number;

  @Column({ type: 'varchar' })
  office: string;
}
