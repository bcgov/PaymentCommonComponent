import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileTypes } from '../../constants';
import { ProgramDailyUploadEntity } from './program-daily-upload.entity';

@Entity('file_uploaded')
export class FileUploadedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ enum: FileTypes, default: FileTypes.TDI17 })
  source_file_type: FileTypes;

  @Column()
  source_file_name: string;

  @Column({ type: 'int4' })
  source_file_length: number;

  @ManyToOne(
    () => ProgramDailyUploadEntity,
    (programDailyUpload) => programDailyUpload.files
  )
  @JoinColumn()
  programFiles: ProgramDailyUploadEntity;
}
