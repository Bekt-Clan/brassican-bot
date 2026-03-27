import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    SlashCommandBuilder,
    TextChannel,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    LabelBuilder,
    UserSelectMenuBuilder,
    ApplicationEmoji,
} from 'discord.js';

import { Environment } from '../../services/environment';
import {
    addTemporaryRank,
    cancelScheduledCommand,
    getActiveScheduledCommands,
} from '../../services/scheduledCommands';
import { TEMPORARY_RANK_TYPE } from '../../models/scheduledCommand';
import { findApplicationEmoji } from '../../helpers/emojis';

export const data = new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('[STAFF ONLY] Manage scheduled commands')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
            .setDescription(
                '[STAFF ONLY] Schedule a temporary rank for a member'
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('list')
            .setDescription('[STAFF ONLY] List all active scheduled commands')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('[STAFF ONLY] Remove a scheduled command')
            .addStringOption((option) =>
                option
                    .setName('id')
                    .setDescription('The ID of the scheduled command to remove')
                    .setRequired(true)
            )
    );

const isStaff = (member: GuildMember): boolean => {
    return member.roles.cache.some(
        (role: Role) =>
            role.id === Environment.DISCORD_MOD_ROLE_ID ||
            role.id === Environment.DISCORD_CA_ROLE_ID ||
            role.id === Environment.DISCORD_ADMIN_ROLE_ID
    );
};

const getRankDisplayName = (rankType: string): string => {
    const rankMap: Record<string, string> = {
        INFERNAL_CAPE: 'Infernal Cape',
        MAX_CAPE: 'Max Cape',
        CABBAGE_RANK: 'Cabbage Rank',
    };
    return rankMap[rankType] || rankType;
};

const handleAdd = async (interaction: ChatInputCommandInteraction) => {
    if (!isStaff(interaction.member as GuildMember)) {
        await interaction.reply({
            content: 'Only members of staff can use this command!',
            flags: 'Ephemeral',
        });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId('scheduleAddModal')
        .setTitle('Schedule Temporary Rank');

    const userInput = new UserSelectMenuBuilder()
        .setCustomId('userId')
        .setPlaceholder('Select a user')
        .setRequired(true);

    const rankTypeSelect = new StringSelectMenuBuilder()
        .setCustomId('rankType')
        .setPlaceholder('Select a rank type')
        .setRequired(true)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Infernal Cape')
                .setDescription('Recently completed first inferno')
                .setValue('INFERNAL_CAPE')
                .setEmoji(
                    (findApplicationEmoji('infernal_cape') as ApplicationEmoji)
                        .id || '🔥'
                ),
            new StringSelectMenuOptionBuilder()
                .setLabel('Max Cape')
                .setDescription('Recently maxed')
                .setValue('MAX_CAPE')
                .setEmoji(
                    (findApplicationEmoji('max_cape') as ApplicationEmoji).id ||
                        '🧙‍♂️'
                ),
            new StringSelectMenuOptionBuilder()
                .setLabel('Cabbage Rank')
                .setDescription('Current OTW/event winner')
                .setValue('CABBAGE_RANK')
                .setEmoji(
                    (findApplicationEmoji('cabbage') as ApplicationEmoji).id ||
                        '🥬'
                )
        );

    const durationInput = new TextInputBuilder()
        .setCustomId('duration')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('14')
        .setValue('14')
        .setMinLength(1)
        .setMaxLength(2)
        .setRequired(true);

    const userIdLabel = new LabelBuilder()
        .setLabel('Select a user')
        .setUserSelectMenuComponent(userInput);

    const rankTypeLabel = new LabelBuilder()
        .setLabel('Which rank would you like to assign?')
        .setStringSelectMenuComponent(rankTypeSelect);

    const durationLabel = new LabelBuilder()
        .setLabel('Duration (in days)')
        .setTextInputComponent(durationInput);

    modal.addLabelComponents(userIdLabel, rankTypeLabel, durationLabel);

    await interaction.showModal(modal);
};

const handleList = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ flags: 'Ephemeral' });

    if (!isStaff(interaction.member as GuildMember)) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    try {
        const scheduledCommands = await getActiveScheduledCommands();

        if (scheduledCommands.length === 0) {
            await interaction.editReply('No active scheduled commands found.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Active Scheduled Commands')
            .setColor(0x00ff00)
            .setTimestamp();

        for (const command of scheduledCommands) {
            const unixTimestamp = Math.floor(
                command.executeAt.getTime() / 1000
            );

            let fieldValue = `**Type:** ${command.type}\n`;
            fieldValue += `**User:** <@${command.discordID}>\n`;

            if (command.rankType) {
                fieldValue += `**Rank:** ${getRankDisplayName(command.rankType)}\n`;
            }

            fieldValue += `**Executes:** <t:${unixTimestamp}:f>\n`;
            fieldValue += `**Created by:** <@${command.createdBy}>`;

            embed.addFields({
                name: `ID: ${command._id}`,
                value: fieldValue,
                inline: false,
            });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing scheduled commands:', error);
        await interaction.editReply(
            'An error occurred while fetching scheduled commands. Please check the logs.'
        );
    }
};

const handleRemove = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ flags: 'Ephemeral' });

    if (!isStaff(interaction.member as GuildMember)) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    const scheduledCommandId = interaction.options.getString('id', true);

    try {
        const success = await cancelScheduledCommand(scheduledCommandId);

        if (success) {
            await interaction.editReply(
                `Successfully cancelled scheduled command \`${scheduledCommandId}\`.`
            );

            const logChannel = interaction.client.channels.cache.get(
                Environment.LOG_CHANNEL_ID
            ) as TextChannel;

            if (logChannel) {
                logChannel.send(
                    `${interaction.member?.toString()} cancelled scheduled command \`${scheduledCommandId}\`.`
                );
            }
        } else {
            await interaction.editReply(
                `Failed to cancel scheduled command \`${scheduledCommandId}\`. It may not exist or may have already been executed.`
            );
        }
    } catch (error) {
        console.error('Error removing scheduled command:', error);
        await interaction.editReply(
            'An error occurred while removing the scheduled command. Please check the logs.'
        );
    }
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'add':
            await handleAdd(interaction);
            break;
        case 'list':
            await handleList(interaction);
            break;
        case 'remove':
            await handleRemove(interaction);
            break;
        default:
            await interaction.reply({
                content: 'Unknown subcommand.',
                flags: 'Ephemeral',
            });
    }
};

export const handleModalSubmit = async (
    interaction: ModalSubmitInteraction
) => {
    await interaction.deferReply({ flags: 'Ephemeral' });

    if (!isStaff(interaction.member as GuildMember)) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    const userIdField = interaction.fields.getField('userId');
    const userId = 'values' in userIdField ? userIdField.values[0] : '';
    const rankTypeValues = interaction.fields.getStringSelectValues('rankType');
    const rankTypeInput = rankTypeValues[0];
    const durationInput = interaction.fields.getTextInputValue('duration');

    if (!userId) {
        await interaction.editReply('Invalid user selection.');
        return;
    }

    const rankType = rankTypeInput as TEMPORARY_RANK_TYPE;

    const duration = parseInt(durationInput, 10);
    if (isNaN(duration) || duration < 1 || duration > 365) {
        await interaction.editReply(
            'Invalid duration. Please provide a number between 1 and 365 days.'
        );
        return;
    }

    try {
        const targetUser = await interaction.client.users.fetch(userId);

        const scheduledCommand = await addTemporaryRank(
            targetUser.id,
            rankType,
            duration,
            interaction.user.id,
            interaction.client
        );

        const unixTimestamp = Math.floor(
            scheduledCommand.executeAt.getTime() / 1000
        );

        await interaction.editReply(
            `Successfully gave ${targetUser.toString()} the **${getRankDisplayName(rankType)}** rank for ${duration} day(s).\n\n` +
                `The rank will be automatically removed on <t:${unixTimestamp}:f>.\n` +
                `Scheduled command ID: \`${scheduledCommand._id}\``
        );

        const logChannel = interaction.client.channels.cache.get(
            Environment.LOG_CHANNEL_ID
        ) as TextChannel;

        if (logChannel) {
            logChannel.send(
                `${interaction.member?.toString()} scheduled a temporary rank for ${targetUser.toString()}:\n` +
                    `- Rank: **${getRankDisplayName(rankType)}**\n` +
                    `- Duration: ${duration} day(s)\n` +
                    `- Removal date: <t:${unixTimestamp}:f>\n` +
                    `- ID: \`${scheduledCommand._id}\``
            );
        }
    } catch (error) {
        console.error('Error scheduling temporary rank:', error);
        await interaction.editReply(
            'An error occurred while scheduling the temporary rank. Please check that the user ID is valid and try again.'
        );
    }
};
