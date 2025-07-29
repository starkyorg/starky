import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDiscordAnalyticsTokenTable1753378126833
  implements MigrationInterface
{
  name = "DropDiscordAnalyticsTokenTable1753378126833";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "discord_analytics_token"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "discord_analytics_token" (
                "id" SERIAL NOT NULL,
                "guildId" character varying NOT NULL,
                "userId" character varying NOT NULL,
                "token" character varying NOT NULL UNIQUE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "discordServerId" character varying,
                CONSTRAINT "PK_analytics_token_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_analytics_discordServerId" FOREIGN KEY ("discordServerId") REFERENCES "discord_server"("id")
            )
        `);
  }
}
