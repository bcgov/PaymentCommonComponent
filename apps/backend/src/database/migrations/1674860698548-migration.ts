import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1674860698548 implements MigrationInterface {
    name = 'migration1674860698548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "fiscal_date" date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "fiscal_date"`);
    }

}
