import { DiscordMember } from "./entity/DiscordMember";
import { DiscordServer } from "./entity/DiscordServer";
import { DiscordServerConfig } from "./entity/DiscordServerConfig";
import { NetworkStatus } from "./entity/NetworkStatus";
import { AppDataSource } from "./data-source";
import { setupMigrations } from "./setup-migrations";
import { DiscordDashboardToken } from "./entity/DiscordDashboardToken";

export const setupDb = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await setupMigrations();
    await AppDataSource.runMigrations({ transaction: "each" });
  }
};

export const DiscordServerRepository =
  AppDataSource.getRepository(DiscordServer);

export const DiscordServerConfigRepository =
  AppDataSource.getRepository(DiscordServerConfig);

export const DiscordMemberRepository =
  AppDataSource.getRepository(DiscordMember);

export const NetworkStatusRepository =
  AppDataSource.getRepository(NetworkStatus);

export const DiscordDashboardTokenRepository = AppDataSource.getRepository(
  DiscordDashboardToken
);
