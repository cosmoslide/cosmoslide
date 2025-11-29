// Deprecated migration kept as a no-op after Tag generalization.
// Originally created hashtags + note_hashtags tables. Replaced by AddTagEntity migration.
import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddHashtagEntity1764384912045 implements MigrationInterface {
    name = 'AddHashtagEntity1764384912045';
    public async up(_queryRunner: QueryRunner): Promise<void> {
        // no-op
    }
    public async down(_queryRunner: QueryRunner): Promise<void> {
        // no-op
    }
}
