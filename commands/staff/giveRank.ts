import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    SlashCommandBuilder,
} from 'discord.js';

import { Environment } from '../../services/environment';
import { scheduleAction } from '../../services/scheduler';
import { Scheduler } from '../../models/scheduler';

export const data = new SlashCommandBuilder()
    .setName('giverank')
    .setDescription('[STAFF ONLY] Give a user a (temporary) rank!')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('The member to give the rank to')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('rank')
            .setDescription('The rank that has to be applied')
            .setRequired(true)
    )
    .addNumberOption((option) =>
        option
            .setName('timestamp')
            .setDescription(
                'The timestamp at which the rank should be reverted'
            )
            .setRequired(true)
    );

export const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ flags: 'Ephemeral' });

    // Check if calling user is a member of staff (mod or CA)
    if (
        !(interaction.member as GuildMember).roles.cache.some(
            (role: Role) =>
                role.id === Environment.DISCORD_MOD_ROLE_ID ||
                role.id === Environment.DISCORD_CA_ROLE_ID
        )
    ) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    const user = interaction.options.getUser('user')!;
    const rank = interaction.options.getString('rank')!;
    const timestamp = interaction.options.getNumber('timestamp')!;

    let endDate: Date | null = new Date(timestamp * 1000);
    if (isNaN(endDate.getTime())) {
        endDate = null;
    }

    if (!endDate) {
        await interaction.editReply(
            'The timestamp provided is invalid. Please provide a valid timestamp.'
        );
        return;
    }

    console.log('Scheduling action');
    await scheduleAction(
        'giveRank',
        {
            user: user.id,
            rank,
        } as unknown as JSON,
        endDate.getTime()
    );

    // write out the month entirely and the time in 24h format
    await interaction.editReply(
        `${user.toString()} has temporarily received the ${rank} rank ${
            endDate
                ? `until ${endDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                  })}`
                : ''
        }! `
    );

    return;
};
