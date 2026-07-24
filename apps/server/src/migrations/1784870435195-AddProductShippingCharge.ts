import {MigrationInterface, QueryRunner} from "typeorm";

export class AddProductShippingCharge1784870435195 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsShippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsShippingcharge"`, undefined);
   }

}
