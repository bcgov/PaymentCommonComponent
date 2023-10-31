import {
  Relation,
  ManyToOne,
  OneToMany,
  Column,
  JoinColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileMetadata } from '../../common/columns/metadata';
import { MatchStatus } from '../../common/const';
import { FileTypes } from '../../constants';
import { TDI17Details } from '../../flat-files';
import { BankLocationEntity } from '../../location/entities';
import { FileUploadedEntity } from '../../parse/entities/file-uploaded.entity';
import { PaymentEntity } from '../../transaction/entities/payment.entity';

@Entity('cash_deposit')
export class CashDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'timestamp' })
  reconciled_on?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  in_progress_on?: Date;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ enum: FileTypes, default: FileTypes.TDI17 })
  source_file_type: FileTypes;

  @Column({ nullable: true })
  program_code?: string;

  @Column({ type: 'date' })
  deposit_date: string;

  @Column({ type: 'int4' })
  pt_location_id: number;

  @Column({ type: 'time', nullable: true })
  deposit_time: string;

  @Column('varchar', { length: 3 })
  seq_no: string;

  @Column('varchar', { length: 40 })
  location_desc: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
  })
  deposit_amt_curr: number;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
  })
  exchange_adj_amt: number;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
  })
  deposit_amt_cdn: number;

  @Column('varchar', { length: 4 })
  destination_bank_no: string;

  @Column({ nullable: true })
  batch_no: string;

  @Column({ nullable: true })
  jv_type: string;

  @Column({ nullable: true })
  jv_no: string;

  @Column({ type: 'enum', default: MatchStatus.PENDING, enum: MatchStatus })
  status: MatchStatus;

  @OneToMany(() => PaymentEntity, (payment) => payment.cash_deposit_match, {
    nullable: true,
  })
  payment_matches?: Relation<PaymentEntity[]>;

  @ManyToOne(() => FileUploadedEntity, { nullable: true })
  @JoinColumn({ name: 'file_uploaded' })
  fileUploadedEntity?: FileUploadedEntity;

  @Column({ name: 'file_uploaded', nullable: true })
  fileUploadedEntityId?: string;

  @ManyToOne(() => BankLocationEntity, { nullable: true })
  @JoinColumn({ referencedColumnName: 'id', name: 'bank' })
  bank: Relation<BankLocationEntity>;

  constructor(data?: TDI17Details) {
    Object.assign(this, data?.resource);
  }
}
