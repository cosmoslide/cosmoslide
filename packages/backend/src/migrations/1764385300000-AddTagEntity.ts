import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagEntity1764385300000 implements MigrationInterface {
    name = 'AddTagEntity1764385300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "count" integer NOT NULL DEFAULT '0', "lastUsedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tags_name" UNIQUE ("name"), CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tags_name" ON "tags" ("name")`);
        await queryRunner.query(`CREATE TABLE "note_tags" ("noteId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "PK_note_tags" PRIMARY KEY ("noteId", "tagId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_note_tags_noteId" ON "note_tags" ("noteId")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_tags_tagId" ON "note_tags" ("tagId")`);
        await queryRunner.query(`ALTER TABLE "note_tags" ADD CONSTRAINT "FK_note_tags_noteId" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_tags" ADD CONSTRAINT "FK_note_tags_tagId" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_tags" DROP CONSTRAINT "FK_note_tags_tagId"`);
        await queryRunner.query(`ALTER TABLE "note_tags" DROP CONSTRAINT "FK_note_tags_noteId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_note_tags_tagId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_note_tags_noteId"`);
        await queryRunner.query(`DROP TABLE "note_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_name"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }
}
