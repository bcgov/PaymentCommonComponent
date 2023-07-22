import { ProgramDailyUploadEntity } from '../../notification/entities/program-daily-upload.entity';
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

@Entity('file_uploaded')
export class FileUploadedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

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
