import { Unique, Column, CreateDateColumn } from 'typeorm';

interface FileMetadataParams {
  parsed_on: string;
  program: string;
  source_file_name: string;
  source_file_line: number;
  source_file_length: number;
}

@Unique(['source_file_name', 'source_file_line'])
export class FileMetadata {
  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, type: 'date' })
  parsed_on: string;

  @Column({ nullable: true })
  program: string;

  @Column({ nullable: true })
  source_file_name: string;

  @Column()
  source_file_line: number;

  @Column()
  source_file_length: number;

  constructor(data: FileMetadataParams) {
    Object.assign(this, data);
  }
}
