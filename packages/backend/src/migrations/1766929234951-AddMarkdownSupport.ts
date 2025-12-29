import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarkdownSupport1766929234951 implements MigrationInterface {
  name = 'AddMarkdownSupport1766929234951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notes" ADD "source" text`);
    await queryRunner.query(
      `ALTER TABLE "notes" ADD "mediaType" character varying NOT NULL DEFAULT 'text/plain'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "mediaType"`);
    await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "source"`);
  }
}
