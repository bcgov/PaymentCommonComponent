import * as csv from 'csvtojson';
import { MigrationInterface, QueryRunner } from 'typeorm';
import path from 'path';
import { PaymentMethodEntity } from '../../transaction/entities';

export class migration1681771116405 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const paymentMethodMasterFile = path.resolve(
      __dirname,
      '../../../master_data/payment_method.csv'
    );
    const paymentMethods = (await csv
      .default()
      .fromFile(paymentMethodMasterFile)) as PaymentMethodEntity[];

    const paymentMethodsEntities = paymentMethods.map((pm) => {
      return new PaymentMethodEntity({
        method: pm.method,
        description: pm.description,
        sbc_code: pm.sbc_code,
        deposit_file_type: pm.deposit_file_type
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
