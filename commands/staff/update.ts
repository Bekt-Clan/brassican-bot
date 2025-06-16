import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    TextChannel,
    SlashCommandBuilder,
} from 'discord.js';

import { Environment } from '../../services/environment';
import { updateMemberRank } from '../../helpers/updateMemberRank';

export const data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('[STAFF ONLY] Attempt to update user cabbage count!')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('The member to update')
            .setRequired(true)
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
        `Request received, attempting to update member's cabbage count.`
    );

    const discordID = interaction.options.getUser('user')!.id;

    try {
        updateMemberRank(discordID, interaction.client);
    } catch (error) {
        const logChannel = interaction.client.channels.cache.get(
            Environment.LOG_CHANNEL_ID
        ) as TextChannel;

        logChannel.send(
            `${interaction.member?.toString()}'s attempt to update ${interaction.options
                .getUser('user')!
                .toString()}'s cabbage count encountered an error.`
        );
        console.log(error);
        await interaction.editReply(
            `The attempt to update member's cabbage count encountered an error.`
        );
        return;
    }
    await interaction.editReply(
        `Member's cabbage count was successfully updated.`
    );
    return;
};
