import { Unique, Column, CreateDateColumn } from 'typeorm';

@Unique(['source_file_name', 'source_file_line'])
export class FileMetadata {
  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  program: string;

  @Column({ nullable: true })
  source_file_name: string;

  @Column()
  source_file_line: number;

  @Column()
  source_file_length: number;

  @Column({ nullable: true, type: 'date' })
  file_created_date: Date;
}
