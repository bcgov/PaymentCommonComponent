import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';

@Entity('file_ingestion_rules')
export class FileIngestionRulesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  program: string;

  @Column({ nullable: true, name: 'cash_cheques_filename' })
  cashChequesFilename?: string; // TDI17

  @Column({ nullable: true, name: 'pos_filename' })
  posFilename?: string; // TDI34

  @Column({ nullable: true, name: 'transactions_filename' })
  transactionsFilename?: string;

  // Number of retries before we send an alert
  @Column({ type: 'int4', default: 0 })
  retries: number;
}
