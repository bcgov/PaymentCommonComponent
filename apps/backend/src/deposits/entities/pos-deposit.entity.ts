import { parse } from 'date-fns';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FileMetadata } from '../../common/columns';
import { MatchStatus } from '../../common/const';
import { FileTypes } from '../../constants';
import { TDI34Details } from '../../flat-files';
import { FileUploadedEntity } from '../../parse/entities/file-uploaded.entity';
import { PosHeuristicRound } from '../../reconciliation/types/const';
import { PaymentEntity, PaymentMethodEntity } from '../../transaction/entities';

@Entity('pos_deposit')
export class POSDepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => FileMetadata, { prefix: false })
  metadata: FileMetadata;

  @Column({ type: 'enum', default: MatchStatus.PENDING, enum: MatchStatus })
  status: MatchStatus;

  @Column({ enum: FileTypes, default: FileTypes.TDI34 })
  source_file_type: FileTypes;

  @Column({ type: 'int4' })
  merchant_id: number;

  @Column('varchar', { length: 19 })
  card_id: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
  })
  transaction_amt: number;

  @Column({ type: 'date' })
  transaction_date: string;

  @Column({ type: 'time', nullable: true })
  transaction_time: string;

  @Column('varchar', { length: 19 })
  terminal_no: string;

  @Column({ nullable: true, type: 'date' })
  settlement_date: string;

  @Column({ nullable: true })
  transaction_code: number;

  @ManyToOne(() => PaymentMethodEntity, (pd) => pd.method, {
    eager: true,
    cascade: false,
  })
  @JoinColumn({ name: 'payment_method', referencedColumnName: 'method' })
  payment_method: Relation<PaymentMethodEntity>;

  @Column({ type: 'enum', nullable: true, enum: PosHeuristicRound })
  heuristic_match_round?: PosHeuristicRound;

  @ManyToMany(() => PaymentEntity, (p) => p.round_four_matches, {
    nullable: true,
  })
  round_four_matches?: Relation<PaymentEntity[]>;

  @ManyToOne(() => FileUploadedEntity, { nullable: true })
  @JoinColumn({ name: 'file_uploaded' })
  fileUploadedEntity?: FileUploadedEntity;

  constructor(data?: TDI34Details) {
    Object.assign(this, data?.resource);
  }

  public get timestamp(): Date {
    return parse(
      `${this.transaction_date}${this.transaction_time}`,
      'yyyy-MM-ddHH:mm:ss',
      new Date()
    );
  }
}
