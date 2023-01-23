import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('master_location_data')
export class MasterLocationDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  'GARMS Location': number;

  @Column({ nullable: true })
  'Type': string;

  @Column({ nullable: true })
  'Location': number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  'Program': number;

  @Column({ nullable: true })
  'Program Description': string;

  @Column({ nullable: true })
  'Min Client': number;

  @Column({ nullable: true })
  'Responsibility Code': string;

  @Column({ nullable: true })
  'Service Line': number;

  @Column({ nullable: true })
  stob: number;

  @Column({ nullable: true })
  'Project No.': number;

  @Column({ nullable: true })
  'Merchant ID': string;

  @Column({ nullable: true })
  notes: string;
}
