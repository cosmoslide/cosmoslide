import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateInitialSchema1760066152495 implements MigrationInterface {
  name = 'GenerateInitialSchema1760066152495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "timeline_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorId" uuid, "noteId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_022a383fbed2a43534631af18d" UNIQUE ("noteId"), CONSTRAINT "PK_1fafc7c1fa488da4b5b82882a39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text, "contentWarning" character varying, "authorId" uuid, "iri" character varying, "inReplyToId" character varying, "inReplyToUri" character varying, "sharedNoteId" uuid, "visibility" character varying NOT NULL DEFAULT 'public', "sensitive" boolean NOT NULL DEFAULT false, "attachments" jsonb DEFAULT '[]', "tags" jsonb DEFAULT '[]', "mentions" jsonb DEFAULT '[]', "likesCount" integer NOT NULL DEFAULT '0', "sharesCount" integer NOT NULL DEFAULT '0', "repliesCount" integer NOT NULL DEFAULT '0', "activityId" character varying, "url" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMP, CONSTRAINT "REL_1ad9709ef8450a54e59dd17fdc" UNIQUE ("sharedNoteId"), CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "actors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" character varying, "iri" character varying, "acct" character varying, "preferredUsername" character varying NOT NULL, "name" character varying, "summary" character varying, "url" character varying, "icon" jsonb, "image" jsonb, "inboxUrl" character varying, "outboxUrl" character varying, "sharedInboxUrl" character varying, "followersUrl" character varying, "followingUrl" character varying, "manuallyApprovesFollowers" boolean NOT NULL DEFAULT false, "type" character varying NOT NULL DEFAULT 'Person', "domain" character varying NOT NULL, "isLocal" boolean NOT NULL DEFAULT false, "userId" uuid, "followersCount" integer NOT NULL DEFAULT '0', "followingCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastFetchedAt" TIMESTAMP, CONSTRAINT "UQ_12642dfdd299726e6b8732973f2" UNIQUE ("actorId"), CONSTRAINT "REL_6e9f8dbdb17e464bb4aae82a15" UNIQUE ("userId"), CONSTRAINT "PK_d8608598c2c4f907a78de2ae461" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_885a81461f94e2cf074f8f2e8f" ON "actors" ("preferredUsername", "domain") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_12642dfdd299726e6b8732973f" ON "actors" ("actorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "followerId" uuid, "followingId" uuid, "status" character varying NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "acceptedAt" TIMESTAMP, CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."keypairs_algorithm_enum" AS ENUM('RSASSA-PKCS1-v1_5', 'Ed25519')`,
    );
    await queryRunner.query(
      `CREATE TABLE "keypairs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "algorithm" "public"."keypairs_algorithm_enum" NOT NULL DEFAULT 'RSASSA-PKCS1-v1_5', "publicKey" text NOT NULL, "privateKey" text NOT NULL, "userId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fa24fe24d2af97c8a600afb7a23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6411ca97c34acb4edd8b28837f" ON "keypairs" ("userId", "algorithm") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "displayName" character varying NOT NULL, "bio" character varying, "email" character varying NOT NULL, "avatarUrl" character varying, "headerUrl" character varying, "isBot" boolean NOT NULL DEFAULT false, "isLocked" boolean NOT NULL DEFAULT false, "isAdmin" boolean NOT NULL DEFAULT false, "followersCount" integer NOT NULL DEFAULT '0', "followingsCount" integer NOT NULL DEFAULT '0', "notesCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "magic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "email" character varying NOT NULL, "userId" uuid, "invitationCode" character varying, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_032811863e2f87b7ea5ac32bbec" UNIQUE ("token"), CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "presentations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "pdfKey" character varying NOT NULL, "url" character varying NOT NULL, "userId" uuid NOT NULL, "noteId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f481051bbd7ae196d0ffa5a644" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "email" character varying, "maxUses" integer NOT NULL DEFAULT '1', "usedCount" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP, "invitedById" uuid NOT NULL, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dfcfae6af22931048ef73078418" UNIQUE ("code"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_posts" ADD CONSTRAINT "FK_8e3fb3c0e19f6f276d17bb56929" FOREIGN KEY ("authorId") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_posts" ADD CONSTRAINT "FK_022a383fbed2a43534631af18d2" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_d358080cb403fe88e62cc9cba58" FOREIGN KEY ("authorId") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2" FOREIGN KEY ("sharedNoteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actors" ADD CONSTRAINT "FK_6e9f8dbdb17e464bb4aae82a157" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_fdb91868b03a2040db408a53331" FOREIGN KEY ("followerId") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb" FOREIGN KEY ("followingId") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "keypairs" ADD CONSTRAINT "FK_e55f3bd3c77e21ddae0b6575d4e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" ADD CONSTRAINT "FK_1c64b8995a08697016868c80186" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "presentations" ADD CONSTRAINT "FK_fa9b1d12f25bfabb72d52118b7e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_b60325e5302be0dad38b423314c" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_b60325e5302be0dad38b423314c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "presentations" DROP CONSTRAINT "FK_fa9b1d12f25bfabb72d52118b7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" DROP CONSTRAINT "FK_1c64b8995a08697016868c80186"`,
    );
    await queryRunner.query(
      `ALTER TABLE "keypairs" DROP CONSTRAINT "FK_e55f3bd3c77e21ddae0b6575d4e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_fdb91868b03a2040db408a53331"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actors" DROP CONSTRAINT "FK_6e9f8dbdb17e464bb4aae82a157"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_1ad9709ef8450a54e59dd17fdc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_d358080cb403fe88e62cc9cba58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_posts" DROP CONSTRAINT "FK_022a383fbed2a43534631af18d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timeline_posts" DROP CONSTRAINT "FK_8e3fb3c0e19f6f276d17bb56929"`,
    );
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "presentations"`);
    await queryRunner.query(`DROP TABLE "magic_links"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6411ca97c34acb4edd8b28837f"`,
    );
    await queryRunner.query(`DROP TABLE "keypairs"`);
    await queryRunner.query(`DROP TYPE "public"."keypairs_algorithm_enum"`);
    await queryRunner.query(`DROP TABLE "follows"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12642dfdd299726e6b8732973f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_885a81461f94e2cf074f8f2e8f"`,
    );
    await queryRunner.query(`DROP TABLE "actors"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "timeline_posts"`);
  }
}
