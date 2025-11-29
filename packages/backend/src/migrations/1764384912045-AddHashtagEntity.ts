import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHashtagEntity1764384912045 implements MigrationInterface {
    name = 'AddHashtagEntity1764384912045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create hashtags table
        await queryRunner.query(`CREATE TABLE "hashtags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "count" integer NOT NULL DEFAULT '0', "lastUsedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7fedde18872deb14e4889361d7b" UNIQUE ("name"), CONSTRAINT "PK_994c5bf9151587560db430018c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7fedde18872deb14e4889361d7" ON "hashtags" ("name") `);
        // Create join table between notes and hashtags
        await queryRunner.query(`CREATE TABLE "note_hashtags" ("noteId" uuid NOT NULL, "hashtagId" uuid NOT NULL, CONSTRAINT "PK_note_hashtags" PRIMARY KEY ("noteId", "hashtagId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_note_hashtags_noteId" ON "note_hashtags" ("noteId")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_hashtags_hashtagId" ON "note_hashtags" ("hashtagId")`);
        await queryRunner.query(`ALTER TABLE "note_hashtags" ADD CONSTRAINT "FK_note_hashtags_noteId" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_hashtags" ADD CONSTRAINT "FK_note_hashtags_hashtagId" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_hashtags" DROP CONSTRAINT "FK_note_hashtags_hashtagId"`);
        await queryRunner.query(`ALTER TABLE "note_hashtags" DROP CONSTRAINT "FK_note_hashtags_noteId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_note_hashtags_hashtagId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_note_hashtags_noteId"`);
        await queryRunner.query(`DROP TABLE "note_hashtags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fedde18872deb14e4889361d7"`);
        await queryRunner.query(`DROP TABLE "hashtags"`);
    }

}
