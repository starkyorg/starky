import { MigrationInterface, QueryRunnerTable } from 'typeorm';

export class CreateDiscordRoleSyncStatusTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "discord_role_sync_status" (
        "id" SERIAL PRIMARY KEY,
        "discordMemberId" varchar NOT NULL,
        "discordServerConfigId" varchar NOT NULL,
        "shouldHaveRole" boolean NOT NULL,
        "date" timestamp NOT NULL,
        CONSTRAINT "UQ_discord_member_server" UNIQUE ("discordMemberId", "discordServerConfigId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "discord_role_sync_status"`);
  }
}
