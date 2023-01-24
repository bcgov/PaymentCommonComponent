import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1674516102011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO public.payment_method ("method",description,sbc_code) VALUES
	 ('AX','AMEX',17),
	 ('P','DEBIT',11),
	 ('V','VISA',13),
	 ('M','MASTERCARD',12),
	 ('PV','DEBIT_VISA',18),
	 ('MV','DEBIT_MASTERCARD',19),
	 ('CASH','CASH',1),
	 ('CHQ','CHEQUE',2),
	 ('ACCOUNT','ACCOUNT',3),
	 ('MVB_AR','MVB_AR',5),
	 ('MVB_HOLD','MVB_HOLD',6),
	 ('US_FUNDS','US_FUNDS',9),
	 ('CHQ_MAIL','CHQ_MAIL',14),
	 ('CHQ_DROP','CHQ_DROP',15),
	 ('RTO','RTO_INTERACT',20),
	 ('ICBC_WO','ICBC_WRITE_OFF',16),
	 ('ICBC_PAY','ICBC_PAYTYPE_10_FOR_PAR',10)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.payment_method;');
  }
}
