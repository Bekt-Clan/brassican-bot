import { SlashCommandBuilder } from 'discord.js';
import { ping } from '../../domain/commands/utility/ping';
import { errorWrapper } from '../errorWrapper';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Wondering if the servers are on fire?');

export const execute = errorWrapper(ping);
