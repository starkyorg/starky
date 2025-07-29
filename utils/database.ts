import { DiscordDashboardTokenRepository } from "../db";

export const saveTokenToDatabase = async (
  guildId: string,
  userId: string,
  token: string
) => {
  try {
    const dashboardToken = DiscordDashboardTokenRepository.create({
      token,
      guildId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });
    await DiscordDashboardTokenRepository.save(dashboardToken);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};
