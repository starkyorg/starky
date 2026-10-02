import { AppDataSource } from '../../config/database';
import { DiscordRoleSyncStatus } from '../../entities/DiscordRoleSyncStatus';

// ... (outros imports existentes)

export async function refreshDiscordMember(discordMemberId: string, discordServerConfigId: string) {
  // ... (lógica existente para calcular shouldHaveRole)
  const shouldHaveRole = await calculateShouldHaveRole(discordMemberId, discordServerConfigId);

  const syncRepo = AppDataSource.getRepository(DiscordRoleSyncStatus);
  
  try {
    const existingStatus = await syncRepo.findOne({
      where: { discordMemberId, discordServerConfigId }
    });

    if (!existingStatus) {
      // Create new record
      const newStatus = syncRepo.create({
        discordMemberId,
        discordServerConfigId,
        shouldHaveRole,
        date: new Date(),
      });
      await syncRepo.save(newStatus);
    } else if (existingStatus.shouldHaveRole !== shouldHaveRole) {
      // Update only if shouldHaveRole changed
      existingStatus.shouldHaveRole = shouldHaveRole;
      existingStatus.date = new Date();
      await syncRepo.save(existingStatus);
    }
    // If shouldHaveRole is the same, we do nothing, keeping the original date
  } catch (error) {
    console.error(`[DiscordRoleSync] Error syncing status for member ${discordMemberId}:`, error);
    // We don't throw here to avoid breaking the main refresh flow, but we log it
  }

  // ... (restante da lógica de atribuição de roles no Discord)
}
