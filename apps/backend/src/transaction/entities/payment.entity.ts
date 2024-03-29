import { parse } from 'date-fns';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Relation,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { PaymentMethodEntity } from './payment-method.entity';
import { TransactionEntity } from './transaction.entity';
import { MatchStatus } from '../../common/const';
import { CashDepositEntity } from '../../deposits/entities/cash-deposit.entity';
import { POSDepositEntity } from '../../deposits/entities/pos-deposit.entity';
import { PosHeuristicRound } from '../../reconciliation/types';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'timestamp' })
  reconciled_on?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  in_progress_on?: Date;
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
  // https://typeorm.io/entities#column-options - For better numeric representation.
  // https://github.com/typeorm/typeorm/issues/873#issuecomment-424643086 - And make this column return proper number
  // 16+4 should be standard for amounts in PCC
  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 2,
    nullable: true,
  })
  foreign_currency_amount?: number;

  @Column('varchar', { length: 3, nullable: false, default: 'CAD' })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 16,
    scale: 4,
    nullable: true,
  })
  exchange_rate?: number;

  @Column({ nullable: true })
  channel?: string;

  @Column({ type: 'enum', default: MatchStatus.PENDING, enum: MatchStatus })
  status: MatchStatus;

  @Column('varchar', { length: 4, nullable: true })
  card_no?: string;

  @Column('varchar', { length: 25, nullable: true })
  merchant_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  device_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  invoice_no?: string;

  // This needs to have a better name
  @Column('varchar', { length: 25, nullable: true })
  tran_id?: string;

  @Column('varchar', { length: 25, nullable: true })
  order_no?: string;

  @Column('varchar', { length: 25, nullable: true })
  approval_code?: string;

  // PCC - Internals

  @ManyToOne(() => PaymentMethodEntity, (pm) => pm.method, { eager: true })
  @JoinColumn([{ name: 'payment_method', referencedColumnName: 'method' }])
  payment_method: Relation<PaymentMethodEntity>;

  @ManyToOne(
    () => TransactionEntity,
    (transaction: TransactionEntity) => transaction.transaction_id,
    { eager: true }
  )
  @JoinColumn({ name: 'transaction', referencedColumnName: 'transaction_id' })
  transaction: Relation<TransactionEntity>;

  @ManyToOne(
    () => CashDepositEntity,
    (cashDeposit: CashDepositEntity) => cashDeposit.payment_matches,
    {
      nullable: true,
    }
  )
  @JoinColumn({ name: 'cash_deposit_match', referencedColumnName: 'id' })
  cash_deposit_match?: Relation<CashDepositEntity>;

  @OneToOne(
    () => POSDepositEntity,
    (posDeposit: POSDepositEntity) => posDeposit.id,
    { nullable: true, cascade: false }
  )
  @JoinColumn({
    name: 'pos_deposit_match',
  })
  pos_deposit_match?: Relation<POSDepositEntity>;

  @Column({ type: 'enum', nullable: true, enum: PosHeuristicRound })
  heuristic_match_round?: PosHeuristicRound;

  @ManyToMany(() => POSDepositEntity, (p) => p.round_four_matches, {
    nullable: true,
  })
  @JoinTable()
  round_four_matches?: Relation<POSDepositEntity[]>;

  constructor(payment?: Partial<PaymentEntity>) {
    Object.assign(this, payment);
  }

  public get timestamp(): Date {
    return parse(
      `${this.transaction.transaction_date}${this.transaction.transaction_time}`,
      'yyyy-MM-ddHH:mm:ss',
      new Date()
    );
  }
}
