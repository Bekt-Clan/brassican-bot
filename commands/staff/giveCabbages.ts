import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    TextChannel,
    SlashCommandBuilder,
} from 'discord.js';

import { Environment } from '../../services/environment';
import { Member } from '../../models/member';
import { updateMemberRank } from '../../helpers/updateMemberRank';

export const data = new SlashCommandBuilder()
    .setName('givecabbages')
    .setDescription('[STAFF ONLY] Give a user bonus cabbages!')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('The member to give cabbages to')
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName('quantity')
            .setDescription('The number of cabbages to give')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('reason')
            .setDescription('cause of given cabbages')
            .setRequired(false)
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

    const discordID = interaction.options.getUser('user')!.id;

    // Check if user is already registered with this discord ID
    let memberData;
    try {
        memberData = await Member.findOne({
            discordID: discordID,
        });

        if (!memberData) {
            await interaction.editReply('User is not registered!');
            return;
        }
    } catch (error) {
        console.error(
            'Error checking if discord ID is already registered: ',
            error
        );
        await interaction.editReply('Something went wrong. Please try again.');
        return;
    }

    memberData.eventCabbages += interaction.options.getInteger('quantity')!;

    await memberData.save();

    await interaction.editReply(
        `${interaction.options
            .getUser('user')!
            .toString()} has been awarded ${interaction.options.getInteger(
            'quantity'
        )} cabbages! `
    );

    updateMemberRank(discordID, interaction.client);

    // Send log message
    const logChannel = interaction.client.channels.cache.get(
        Environment.LOG_CHANNEL_ID
    ) as TextChannel;

    const userName = interaction.options.getUser('user')!.toString();
    const amount = interaction.options.getInteger('quantity');
    const approvingMod = interaction.member?.toString();
    let reason = interaction.options.getString('reason');
    if (reason === null) {
        reason = 'with no reason given';
    } else {
        reason = 'with reason: ' + reason;
    }

    if (logChannel) {
        logChannel.send(
            `${userName} has been awarded ${amount} cabbages by ${approvingMod} ${reason}`
        );
    }

    return;
};
