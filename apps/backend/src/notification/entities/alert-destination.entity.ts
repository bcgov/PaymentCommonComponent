import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileIngestionRulesEntity } from './file-ingestion-rules.entity';
import { ProgramRequiredFileEntity } from '../../parse/entities/program-required-file.entity';

@Entity('alert_destination')
export class AlertDestinationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;

  /**
   * Only one of the next three must be truthy
   */

  // Send all alerts to this destination
  @Column('boolean', { default: false, name: 'all_alerts' })
  allAlerts: boolean;

  // Send all alerts for a certain program / rule to this destination
  @ManyToOne(() => FileIngestionRulesEntity, { nullable: true })
  @JoinColumn({ name: 'rule_id' })
  rule?: FileIngestionRulesEntity;

  // Send all alerts for a specific file type / data source to this destination
  @ManyToOne(() => ProgramRequiredFileEntity, { nullable: true })
  @JoinColumn({ name: 'required_file_id' })
  requiredFile?: ProgramRequiredFileEntity;

  // Typically email; can eventually be a phone number if necessary
  @Column({ nullable: false })
  destination: string;
}
