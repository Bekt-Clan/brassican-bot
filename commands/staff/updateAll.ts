import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    TextChannel,
    SlashCommandBuilder,
} from 'discord.js';

import { updateAllMemberRanks } from '../../helpers/updateAllMemberRanks';
import { Environment } from '../../services/environment';

export const data = new SlashCommandBuilder()
    .setName('updateall')
    .setDescription(
        '[STAFF ONLY] [WARNING: THIS IS DEMANDING] Attempt to update all user cabbage counts!'
    );

export const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ flags: 'Ephemeral' });

    // Check if calling user is a member of staff (mod or CA)
    if (
        !(interaction.member as GuildMember).roles.cache.some(
            (role: Role) =>
                role.id === Environment.DISCORD_MOD_ROLE_ID ||
                role.id === Environment.DISCORD_CA_ROLE_ID ||
                role.id === Environment.DISCORD_ADMIN_ROLE_ID
        )
    ) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    await interaction.editReply(
        `Request received, attempting to update all member's cabbage counts.`
    );

    try {
        updateAllMemberRanks(interaction.client);
    } catch (error) {
        const logChannel = interaction.client.channels.cache.get(
            Environment.LOG_CHANNEL_ID
        ) as TextChannel;

        logChannel.send(
            `${interaction.member?.toString()}'s attempt to update all member's cabbage counts encountered an error.`
        );

        console.log(error);
        return;
    }

    return;
};
