import { MigrationInterface, QueryRunner } from "typeorm";

export class DropLegacyHashtagTablesIfExist implements MigrationInterface {
    name = 'DropLegacyHashtagTablesIfExist_20251201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop legacy hashtag tables if they exist
        await queryRunner.query('DROP TABLE IF EXISTS "hashtag" CASCADE;');
        await queryRunner.query('DROP TABLE IF EXISTS "note_hashtags" CASCADE;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op: do not recreate legacy tables
    }
}
