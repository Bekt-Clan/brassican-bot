import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
} from 'discord.js';
import { AnyZodObject } from 'zod';

export const validationWrapper = (
    handler: (
        interaction: ChatInputCommandInteraction,
        parsedOptions: { [x: string]: unknown }
    ) => Promise<void>,
    inputSchema: AnyZodObject
) => {
    return async (interaction: ChatInputCommandInteraction) => {
        const objectifiedOptions: { [key: string]: unknown } = {};
        interaction.options.data.forEach((option) => {
            switch (option.type) {
                case ApplicationCommandOptionType.String:
                    objectifiedOptions[option.name] =
                        interaction.options.getString(option.name);
                    break;
                case ApplicationCommandOptionType.Integer:
                    objectifiedOptions[option.name] =
                        interaction.options.getInteger(option.name);
                    break;
                case ApplicationCommandOptionType.User:
                    objectifiedOptions[option.name] =
                        interaction.options.getUser(option.name);
                    break;
                default:
                    throw new Error(`Unsupported option type: ${option.type}`);
            }
        });

        const parsedOptions = inputSchema.parse(objectifiedOptions);
        await handler(interaction, parsedOptions);
    };
};
