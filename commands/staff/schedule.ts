import {
    ChatInputCommandInteraction,
    GuildMember,
    Role,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from 'discord.js';

import { Environment } from '../../services/environment';
import { Scheduler } from '../../models/scheduler';

export const data = new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('[STAFF ONLY] Give a user a (temporary) rank!')
    .addSubcommand((subcommand) =>
        subcommand.setName('list').setDescription('List all scheduled actions')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('delete')
            .setDescription('Delete a scheduled action')
            .addStringOption((option) =>
                option
                    .setName('id')
                    .setDescription('The ID of the scheduled action to delete')
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
                role.id === Environment.DISCORD_CA_ROLE_ID
        )
    ) {
        await interaction.editReply(
            'Only members of staff can use this command!'
        );
        return;
    }

    switch (interaction.options.getSubcommand()) {
        case 'list':
            const actions = await Scheduler.find({}).sort({ timestamp: -1 });
            const embed = new EmbedBuilder()
                .setTitle('Scheduled Actions')
                .setDescription(
                    `There are ${actions.length} scheduled actions:`
                )
                .addFields(
                    {
                        name: 'ID',
                        value: '`' + actions[0]._id + '`',
                        inline: false,
                    },
                    {
                        name: 'Action',
                        value: '`' + actions[0].command + '`',
                        inline: false,
                    },
                    // loop over all keys of the arguments object and then create an inline table
                    {
                        name: 'Arguments',
                        value: ' ',
                        inline: false,
                    },
                    ...Object.keys(actions[0].arguments).map((key) => {
                        return {
                            name: key,
                            value:
                                '`' + (actions[0].arguments as any)[key] + '`',
                            inline: true,
                        };
                    }),
                    {
                        name: 'Execution time',
                        value:
                            '`' +
                            new Date(actions[0].timestamp).toLocaleString() +
                            '`',
                        inline: false,
                    }
                )
                .setColor([17, 255, 0])
                .setFooter({
                    text: `Page ${1} / ${1} • Brassican Bot`,
                    iconURL:
                        'https://cdn.discordapp.com/avatars/1142496380343038108/8744d1e6497ef337b6a1a04c88148b2a.webp',
                });

            const previousButton = new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary);

            const nextButton = new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary);

            const paginationActionRow =
                new ActionRowBuilder<ButtonBuilder>().addComponents([
                    previousButton,
                    nextButton,
                ]);

            await interaction.editReply({
                embeds: [embed],
                components: [paginationActionRow],
            });

            break;
        case 'delete':
            const actionId = interaction.options.getString('id')!;
            await Scheduler.deleteOne({ id: actionId });
            await interaction.editReply(
                `Scheduled action with ID ${actionId} has been deleted.`
            );
            break;
        default:
            await interaction.editReply(
                'Invalid subcommand. Please use `/schedule list` or `/schedule delete`.'
            );
            return;
    }

    return;
};
