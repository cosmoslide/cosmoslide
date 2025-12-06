import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHashtagIndexes20251129 implements MigrationInterface {
  name = 'AddHashtagIndexes20251129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tag.name 인덱스 (대소문자 구분 없는 검색용)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tag_name_lower ON tag (LOWER(name));`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tag_name_lower;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_note_tags_tag_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_note_tags_note_id;`);
  }
}
