import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { GiveCabbagesCommandOptionsSchema } from '../types';
import { giveCabbages } from '../../domain/commands/staff/giveCabbages';

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
    const options = GiveCabbagesCommandOptionsSchema.parse({
        user: interaction.options.getUser('user'),
        quantity: interaction.options.getInteger('quantity'),
        reason: interaction.options.getString('reason'),
    });

    await interaction.deferReply({ flags: 'Ephemeral' });

    let title: string;
    let description: string;

    giveCabbages({
        initiator: interaction.user,
        receiver: options.user,
        quantity: options.quantity,
        reason: options.reason,
    })
        .then(() => {
            title = 'Cabbages are being harvested ...';
            description = `${options.user} will be awarded \`${options.quantity}\` cabbages!`;
        })
        .catch((error) => {
            title = 'Error giving cabbages';
            description = error.message;
        })
        .finally(async () => {
            await interaction.editReply({
                embeds: [
                    {
                        title,
                        description,
                        color: 0x5d811f,
                    },
                ],
            });
        });

    return;
};
