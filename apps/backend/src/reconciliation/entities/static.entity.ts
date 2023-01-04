import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('trans_cd')
export class TransactionCDEntity {
  @PrimaryColumn()
  code: string;

  @Column()
  type: string;

  @Column()
  description: string;
}

@Entity('trans_type')
export class TransType {
  @PrimaryColumn()
  code: string;

  @Column()
  type: string;
}

@Entity('card_vendor')
export class CardVendor {
  @PrimaryColumn()
  code: string;

  @Column()
  type: string;
}
