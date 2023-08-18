import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { FileIngestionRulesEntity } from './file-ingestion-rules.entity';
import { FileUploadedEntity } from '../../parse/entities/file-uploaded.entity';

@Entity('program_daily_upload')
export class ProgramDailyUploadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'date', name: 'daily_date' })
  dailyDate: string;

  @Column()
  success: boolean;

  @ManyToOne(() => FileIngestionRulesEntity)
  @JoinColumn()
  rule: Relation<FileIngestionRulesEntity>;

  @OneToMany(
    () => FileUploadedEntity,
    (fileUploaded) => fileUploaded.dailyUpload
  )
  files: Relation<FileUploadedEntity[]>;
}
