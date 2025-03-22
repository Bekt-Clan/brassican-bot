import { ChatInputCommandInteraction } from 'discord.js';
import { ZodError } from 'zod';
import { fromError } from 'zod-validation-error';
import { ApplicationError } from '../services/ApplicationError';

export const errorWrapper = (
    handler: (interaction: ChatInputCommandInteraction) => Promise<void>
) => {
    return async (interaction: ChatInputCommandInteraction) => {
        try {
            await handler(interaction);
        } catch (error) {
            let errorTitle;
            let errorMessage;

            if (error instanceof ZodError) {
                const validationError = fromError(error);
                console.error(validationError);
                errorTitle = 'Validation error';
                errorMessage = validationError.toString();
            } else if (error instanceof ApplicationError) {
                console.error(error);
                errorTitle = 'An error occurred';
                errorMessage = error.message;
            } else {
                console.error(error);
                errorTitle = 'An error occurred';
                errorMessage = 'Internal server error';
            }

            await interaction.reply({
                options: { flags: 'Ephemeral' },
                embeds: [
                    {
                        title: errorTitle,
                        description: errorMessage,
                        color: 0xff0000,
                    },
                ],
            });
        }
    };
};
