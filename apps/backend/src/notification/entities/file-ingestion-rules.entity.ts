import { Column, OneToMany, PrimaryGeneratedColumn, Entity } from 'typeorm';
import { ProgramRequiredFileEntity } from '../../parse/entities/program-required-file.entity';

@Entity('file_ingestion_rules')
export class FileIngestionRulesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  program: string;

  @OneToMany(() => ProgramRequiredFileEntity, (file) => file.rule)
  requiredFiles: ProgramRequiredFileEntity[];
}
