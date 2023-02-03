import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as csv from 'csvtojson';
import { PaymentMethod } from '../../transaction/transaction.interface';
import { PaymentMethodEntity } from '../../transaction/entities';

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
