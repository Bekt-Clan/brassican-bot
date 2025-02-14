import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ping } from '../../domain/commands/utility/ping';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Wondering if the servers are on fire?');

export const execute = async (interaction: ChatInputCommandInteraction) =>
    ping(interaction);
