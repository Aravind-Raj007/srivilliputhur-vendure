import {MigrationInterface, QueryRunner} from "typeorm";

export class AddProductVideo1788776381061 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsTnshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsKeralashippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsKarnatakashippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsApshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsMhshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsDlshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsOtherstateshippingcharge"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" DROP COLUMN "customFieldsStateshippingcharges"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product" ADD "customFieldsVideoassetid" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product" ADD "customFieldsVideourl" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product" ADD CONSTRAINT "FK_e0802064a5f6128d11cfe747e29" FOREIGN KEY ("customFieldsVideoassetid") REFERENCES "vendure"."asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product" DROP CONSTRAINT "FK_e0802064a5f6128d11cfe747e29"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product" DROP COLUMN "customFieldsVideourl"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product" DROP COLUMN "customFieldsVideoassetid"`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsStateshippingcharges" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsOtherstateshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsDlshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsMhshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsApshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsKarnatakashippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsKeralashippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "vendure"."product_variant" ADD "customFieldsTnshippingcharge" integer NOT NULL DEFAULT '0'`, undefined);
   }

}
