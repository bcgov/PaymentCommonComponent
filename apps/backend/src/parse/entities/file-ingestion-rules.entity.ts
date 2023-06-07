import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';
import { Ministries } from '../../constants';

@Entity('file_ingestion_rules')
export class FileIngestionRulesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  program: string;

  @Column({ nullable: false })
  cashChequesFilename?: string; // TDI17

  @Column({ nullable: false })
  cardsFilename?: string; // TDI34

  @Column({ nullable: false })
  transactionsFilename?: string;

  // Number of retries before we send an alert
  @Column({ type: 'int4', default: 0 })
  retries: number;
}
