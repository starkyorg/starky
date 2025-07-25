import { Entity, OneToMany, PrimaryColumn } from "typeorm";

import { DiscordMember } from "./DiscordMember";
import { DiscordServerConfig } from "./DiscordServerConfig";
import { DiscordDashboardToken } from "./DiscordDashboardToken";

@Entity({
  name: "discord_server",
})
export class DiscordServer {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => DiscordMember, (member) => member.discordServer)
  members: DiscordMember[];

  @OneToMany(
    () => DiscordServerConfig,
    (serverConfig) => serverConfig.discordServer
  )
  serverConfigs: DiscordServerConfig[];

  @OneToMany(
    () => DiscordDashboardToken,
    (dashboardToken) => dashboardToken.discordServer
  )
  dashboardTokens: DiscordDashboardToken[];
}

