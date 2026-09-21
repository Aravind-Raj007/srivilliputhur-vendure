import {MigrationInterface, QueryRunner} from "typeorm";

export class AddProductPriority1789988545889 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product" ADD "customFieldsPriority" boolean NOT NULL DEFAULT false`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "vendure"."product" DROP COLUMN "customFieldsPriority"`, undefined);
   }

}
