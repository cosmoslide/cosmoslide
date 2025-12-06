import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountDefaultVisibility1760252907817
  implements MigrationInterface
{
  name = 'AddAccountDefaultVisibility1760252907817';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_defaultvisibility_enum" AS ENUM('public', 'unlisted', 'followers', 'direct')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "defaultVisibility" "public"."users_defaultvisibility_enum" NOT NULL DEFAULT 'public'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "defaultVisibility"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."users_defaultvisibility_enum"`,
    );
  }
}
