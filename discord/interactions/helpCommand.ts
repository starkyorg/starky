import { REST } from "@discordjs/rest";
import { ChatInputCommandInteraction, Client } from "discord.js";

import { slashCommandsArray } from "../commands/index";
import { buildAppUrl, getAppBaseUrl } from "../../utils/appUrl";

export const handleHelpCommand = async (
  interaction: ChatInputCommandInteraction,
  client: Client,
  restClient: REST
) => {
  try {
    const userId = interaction.member?.user?.id;
    const guildId = interaction.guildId;

    if (!userId || !guildId) return;

    const commands =
      slashCommandsArray
        .map((cmd) => `• \`/${cmd.name}\` - ${cmd.description}`)
        .join("\n") || "No commands available.";

    const responseMessage = `**Available Commands:**\n${commands}\n\n**Helpful Resources:**\n• For configuration examples, check out [/examples](${buildAppUrl(
      "/examples"
    )}).\n• For help setting up the bot, visit [/help](${buildAppUrl(
      "/help"
    )}).\n\nFor support, join our [Telegram Group](https://t.me/+Mi34Im1Uafc1Y2Q8).\nFor more information, visit [Starky](${getAppBaseUrl()}).`;

    await interaction.reply({
      content: responseMessage,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error handling /help command:", error);
  }
};
