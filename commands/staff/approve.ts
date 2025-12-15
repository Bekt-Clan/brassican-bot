import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';

import { updateMemberRank } from '../../helpers/updateMemberRank';
import { AD_TIER, CA_TIER, Member } from '../../models/member';
import { Environment } from '../../services/environment';

export const data = new SlashCommandBuilder()
    .setName('approve')
    .setDescription('[STAFF ONLY] Approve a rank submission')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('blorva')
            .setDescription('[STAFF ONLY] Approve ancient blood ornament kit')
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription(
                        'The member whose submission you are approving'
                    )
                    .setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('radiant')
            .setDescription('[STAFF ONLY] Approve purifying sigil')
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription(
                        'The member whose submission you are approving'
                    )
                    .setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('quest-cape')
            .setDescription('[STAFF ONLY] Approve quest cape')
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription(
                        'The member whose submission you are approving'
                    )
                    .setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('achievement-diary')
            .setDescription('[STAFF ONLY] Approve an achievement diary tier')
            .addStringOption((option) =>
                option
                    .setName('tier')
                    .setDescription(
                        'The highest tier the user has fully completed'
                    )
                    .setRequired(true)
                    .addChoices(
                        {
                            name: 'Easy',
                            value: 'Easy',
                        },
                        {
                            name: 'Medium',
                            value: 'Medium',
                        },
                        {
                            name: 'Hard',
                            value: 'Hard',
                        },
                        {
                            name: 'Elite',
                            value: 'Elite',
                        }
                    )
            )
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription(
                        'The member whose submission you are approving'
                    )
                    .setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('combat-achievements')
            .setDescription('[STAFF ONLY] Approve a combat achievement tier')
            .addStringOption((option) =>
                option
                    .setName('tier')
                    .setDescription(
                        'The highest tier the user has fully completed'
                    )
                    .setRequired(true)
                    .addChoices(
                        {
                            name: 'Easy',
                            value: 'Easy',
                        },
                        {
                            name: 'Medium',
                            value: 'Medium',
                        },
                        {
                            name: 'Hard',
                            value: 'Hard',
                        },
                        {
                            name: 'Elite',
                            value: 'Elite',
                        },
                        {
                            name: 'Master',
                            value: 'Master',
                        },
                        {
                            name: 'Grandmaster',
                            value: 'Grandmaster',
                        }
                    )
            )
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription(
                        'The member whose submission you are approving'
                    )
                    .setRequired(true)
            )
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

    const discordID = interaction.options.getUser('user')?.id;
    if (!discordID) {
        await interaction.editReply('Invalid user ID!');
        return;
    }

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

    let submissionLogString;

    // Update memberData based on submission
    switch (interaction.options.getSubcommand()) {
        case 'blorva':
            submissionLogString = 'blorva completion';
            memberData.accountProgression.blorva = true;
            break;

        case 'radiant':
            submissionLogString = 'purifying sigil completion';
            memberData.accountProgression.radiant = true;
            break;

        case 'quest-cape':
            submissionLogString = 'quest cape completion';
            memberData.accountProgression.questCape = true;
            break;

        case 'achievement-diary':
            memberData.accountProgression.adTier =
                interaction.options.getString('tier')! as AD_TIER;
            submissionLogString = `${interaction.options
                .getString('tier')
                ?.toLowerCase()} achievement diaries completion`;
            break;

        case 'combat-achievements':
            memberData.accountProgression.caTier =
                interaction.options.getString('tier')! as CA_TIER;
            submissionLogString = `${interaction.options
                .getString('tier')
                ?.toLowerCase()} combat achievements completion`;
            break;

        default:
            submissionLogString = 'ERROR';
            break;
    }

    await memberData.save();

    // Complete the interaction
    await interaction.editReply(
        `${interaction.options
            .getUser('user')
            ?.toString()}'s submission of ${submissionLogString} has been approved successfully!`
    );

    updateMemberRank(discordID, interaction.client);

    // Send log message
    const logChannel = interaction.client.channels.cache.get(
        Environment.LOG_CHANNEL_ID
    ) as TextChannel;

    logChannel.send(
        `${interaction.options
            .getUser('user')
            ?.toString()}'s submission of ${submissionLogString} has been approved by ${interaction.member?.toString()}`
    );

    return;
};
