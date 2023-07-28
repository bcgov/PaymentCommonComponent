import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { FileTypes } from '../../constants';
import { ProgramDailyUploadEntity } from '../../notification/entities/program-daily-upload.entity';

@Entity('file_uploaded')
export class FileUploadedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', name: 'file_created_date', nullable: true })
  fileCreatedDate: Date;

  @Column({
    enum: FileTypes,
    name: 'source_file_type',
  })
  sourceFileType: FileTypes;

  @Column({ name: 'source_file_name' })
  sourceFileName: string;

  @Column({ type: 'int4', name: 'source_file_length' })
  sourceFileLength: number;

  @ManyToOne(
    () => ProgramDailyUploadEntity,
    (programDailyUpload: ProgramDailyUploadEntity) => programDailyUpload.files
  )
  @JoinColumn({ name: 'daily_upload_id' })
  dailyUpload: Relation<ProgramDailyUploadEntity>;
}
