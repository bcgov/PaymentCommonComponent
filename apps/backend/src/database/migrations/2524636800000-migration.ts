import * as csv from 'csvtojson';
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import { PaymentMethodEntity } from '../../transaction/entities';
import { PaymentMethod } from '../../transaction/interface/transaction.interface';

export class migration2524636800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const paymentMethodMasterFile = path.resolve(
      __dirname,
      '../../../master_data/payment_method.csv'
    );
    const paymentMethods = (await csv
      .default()
      .fromFile(paymentMethodMasterFile)) as PaymentMethod[];

    const paymentMethodsEntities = paymentMethods.map((pm) => {
      return new PaymentMethodEntity({
        method: pm.method,
        description: pm.description,
        sbc_code: pm.sbc_code
      });
    });

    await queryRunner.manager.save(paymentMethodsEntities);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM 
            public.payment_method 
    `);
  }
}
