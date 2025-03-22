import { SlashCommandBuilder } from 'discord.js';

import { errorWrapper } from '../errorWrapper';
import { validationWrapper } from '../validationWrapper';
import { cabbages } from '../../domain/commands/member/cabbages';
import { cabbageCommandParameterSchema } from '../types';

export const data = new SlashCommandBuilder()
    .setName('cabbages')
    .setDescription('Get your current cabbage count!')
    .addUserOption((option) =>
        option
            .setName('member')
            .setDescription('The member you want to see the cabbage count of')
            .setRequired(false)
    );

export const execute = errorWrapper(
    validationWrapper(cabbages, cabbageCommandParameterSchema)
);
