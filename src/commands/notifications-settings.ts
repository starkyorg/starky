import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../lib/prisma'; // Assumindo a existência de um cliente prisma exportado

export const NotificationSettingsCommand = {
    data: new SlashCommandBuilder()
        .setName('starky-notifications-settings')
        .setDescription('Configure notification preferences for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId!;
        const settings = await prisma.notificationSettings.findUnique({ where: { guildId } });

        const embed = {
            title: '🔔 Notification Settings',
            description: `Configure where and when Starky sends notifications.\n\n` +
                `**Channel:** ${settings?.notificationChannelId ? `<#${settings.notificationChannelId}>` : 'Not set'}\n` +
                `**Role Added:** ${settings?.notifyRoleAdded ? '✅' : '❌'}\n` +
                `**Wallet Connected:** ${settings?.notifyWalletConnected ? '✅' : '❌'}\n` +
                `**Role Removed:** ${settings?.notifyRoleRemoved ? '✅' : '❌'}`,
            color: 0x5865F2,
        };

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('notif_settings_menu')
                    .setPlaceholder('Select a setting to change')
                    .addOptions([
                        { label: 'Set Notification Channel', value: 'set_channel' },
                        { label: 'Toggle Role Added Notification', value: 'toggle_role_added' },
                        { label: 'Toggle Wallet Connected Notification', value: 'toggle_wallet_connected' },
                        { label: 'Toggle Role Removed Notification', value: 'toggle_role_removed' },
                    ]),
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
