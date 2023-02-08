import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class LogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  context?: string;

  @Column()
  message?: string;

  @Column()
  level?: string;

  @CreateDateColumn()
  creationDate: Date;
}
