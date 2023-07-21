import { FileTypes } from '../../constants';
import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { FileIngestionRulesEntity } from './file-ingestion-rules.entity';

@Entity('program_required_file')
export class ProgramRequiredFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column()
  filename: string;

  @Column({ enum: FileTypes, name: 'file_type' })
  fileType: FileTypes;

  @ManyToOne(() => FileIngestionRulesEntity, (rule) => rule.requiredFiles)
  @JoinColumn({ name: 'rule_id' })
  rule: Relation<FileIngestionRulesEntity>;
}
