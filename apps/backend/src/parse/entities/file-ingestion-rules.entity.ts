import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';

@Entity('file_ingestion_rules')
export class FileIngestionRulesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  program: string;

  @Column({ nullable: true })
  cashChequesFilename?: string; // TDI17

  @Column({ nullable: true })
  cardsFilename?: string; // TDI34

  @Column({ nullable: true })
  transactionsFilename?: string;

  // Number of retries before we send an alert
  @Column({ type: 'int4', default: 0 })
  retries: number;
}
