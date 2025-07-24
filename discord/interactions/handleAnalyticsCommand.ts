import { REST } from "@discordjs/rest";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { v4 as uuidv4 } from "uuid"; // For token generation

import { saveTokenToDatabase } from "../../utils/database"; // updated import

export const handleAnalyticsCommand = async (
  interaction: ChatInputCommandInteraction,
  client: Client,
  restClient: REST
) => {
  try {
    const userId = interaction.member?.user?.id;
    const guildId = interaction.guildId;

    if (!userId || !guildId) return;

    const token = uuidv4();

    // Save using unified dashboard token storage
    await saveTokenToDatabase(guildId, userId, token);

    const analyticsUrl = `${process.env.BASE_URL}/analytics/${guildId}/${token}`;

    await interaction.reply({
      content: `View analytics here: [Click Here](${analyticsUrl})`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error handling /analytics command:", error);
  }
};

