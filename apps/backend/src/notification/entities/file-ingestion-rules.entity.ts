import { Column, OneToMany, PrimaryGeneratedColumn, Entity } from 'typeorm';
import { ProgramRequiredFileEntity } from './program-required-file.entity';

@Entity('file_ingestion_rules')
export class FileIngestionRulesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  program: string;

  @OneToMany(() => ProgramRequiredFileEntity, (file) => file.rule)
  requiredFiles: ProgramRequiredFileEntity[];

  // Number of retries before we send an alert
  @Column({ type: 'int4', default: 0 })
  retries: number;
}
