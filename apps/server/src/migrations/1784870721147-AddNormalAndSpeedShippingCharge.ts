import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNormalAndSpeedShippingCharge1784870721147 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsShippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsNormalshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsSpeedshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsSpeedshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsNormalshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsShippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
   }

}
