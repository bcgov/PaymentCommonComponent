import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileIngestionRulesEntity } from './file-ingestion-rules.entity';
import { FileUploadedEntity } from './file-uploaded.entity';

@Entity('program_daily_upload')
export class ProgramDailyUploadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'date' })
  dataDate: string;

  @Column()
  success: boolean;

  // Number of times we have tried uploading this grouping for a day
  @Column({ type: 'int4' })
  retries: number;

  @ManyToOne(() => FileIngestionRulesEntity)
  @JoinColumn()
  rule: FileIngestionRulesEntity;

  @OneToMany(
    () => FileUploadedEntity,
    (fileUploaded) => fileUploaded.programFiles
  )
  files: FileUploadedEntity[];
}
