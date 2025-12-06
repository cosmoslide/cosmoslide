import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueConstraintForSharedNote1760511087590
  implements MigrationInterface
{
  name = 'RemoveUniqueConstraintForSharedNote1760511087590';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "REL_1ad9709ef8450a54e59dd17fdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2" FOREIGN KEY ("sharedNoteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "REL_1ad9709ef8450a54e59dd17fdc" UNIQUE ("sharedNoteId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2" FOREIGN KEY ("sharedNoteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
