import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMentionEntity1761548302622 implements MigrationInterface {
  name = 'AddMentionEntity1761548302622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mentions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" uuid, "noteId" uuid, CONSTRAINT "PK_2c728c4685beaa7be19e11eae42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "mentions"`);
    await queryRunner.query(
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_27a389a9c160f1bfe908dce11cf" FOREIGN KEY ("actorId") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mentions" ADD CONSTRAINT "FK_08d1c5fb7aceb1c6a1109c52784" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_08d1c5fb7aceb1c6a1109c52784"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mentions" DROP CONSTRAINT "FK_27a389a9c160f1bfe908dce11cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD "mentions" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(`DROP TABLE "mentions"`);
  }
}
