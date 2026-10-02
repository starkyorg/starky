// Adicionando a lógica de tratamento para o menu de configurações
import { Interaction, StringSelectMenuInteraction } from 'discord.js';
import { prisma } from '../lib/prisma';

export async function handleNotificationSettings(interaction: StringSelectMenuInteraction) {
    if (interaction.customId !== 'notif_settings_menu') return;

    const guildId = interaction.guildId!;
    const value = interaction.values[0];

    let settings = await prisma.notificationSettings.findUnique({ where: { guildId } });
    if (!settings) {
        settings = await prisma.notificationSettings.create({ data: { guildId } });
    }

    if (value === 'set_channel') {
        await interaction.reply({ content: 'Please mention the channel in your next message or use a specific channel selector (implementation depends on bot version). For now, please use the admin panel.', ephemeral: true });
        // Nota: Para simplificar, em um cenário real, usaríamos um Modal ou Coletor de Mensagens.
        return;
    }

    if (value === 'toggle_role_added') {
        await prisma.notificationSettings.update({
            where: { guildId },
            data: { notifyRoleAdded: !settings.notifyRoleAdded }
        });
    } else if (value === 'toggle_wallet_connected') {
        await prisma.notificationSettings.update({
            where: { guildId },
            data: { notifyWalletConnected: !settings.notifyWalletConnected }
        });
    } else if (value === 'toggle_role_removed') {
        await prisma.notificationSettings.update({
            where: { guildId },
            data: { notifyRoleRemoved: !settings.notifyRoleRemoved }
        });
    }

    const updated = await prisma.notificationSettings.findUnique({ where: { guildId } });
    const embed = {
        title: '🔔 Notification Settings Updated',
        description: `**Channel:** ${updated?.notificationChannelId ? `<#${updated.notificationChannelId}>` : 'Not set'}\n` +
            `**Role Added:** ${updated?.notifyRoleAdded ? '✅' : '❌'}\n` +
            `**Wallet Connected:** ${updated?.notifyWalletConnected ? '✅' : '❌'}\n` +
            `**Role Removed:** ${updated?.notifyRoleRemoved ? '✅' : '❌'}`,
        color: 0x00FF00,
    };

    await interaction.update({ embeds: [embed], components: [interaction.message.components] });
}
