import { BaseInteraction, Events, TextChannel } from 'discord.js';

import { Environment } from '../services/environment';
import { ModifiedDiscordClient } from '../discord';
import { handleModalSubmit as handleScheduleModalSubmit } from '../commands/staff/schedule';

export const name = Events.InteractionCreate;

export const execute = async (interaction: BaseInteraction) => {
    if (interaction.isChatInputCommand()) {
        const command = (
            interaction.client as ModifiedDiscordClient
        ).commands?.get(interaction.commandName);

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'scheduleAddModal') {
            try {
                await handleScheduleModalSubmit(interaction);
            } catch (error) {
                console.error('Error handling schedule modal submission');
                console.error(error);
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'completeRankUpdate') {
            await interaction.update('Clearing...');

            await interaction.message.delete();

            const logChannel = interaction.client.channels.cache.get(
                Environment.LOG_CHANNEL_ID
            ) as TextChannel;

            logChannel.send(
                `${interaction.member?.toString()} marked the following complete: \n    "${interaction.message.toString()}"`
            );
        }
    } else if (interaction.isStringSelectMenu()) {
        // TODO
    }
};
