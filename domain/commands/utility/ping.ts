import { ChatInputCommandInteraction } from 'discord.js';

export const ping = async (interaction: ChatInputCommandInteraction) => {
    const clientPing = Math.abs(interaction.client.ws.ping);
    const latency = Math.abs(Date.now() - interaction.createdTimestamp);

    await interaction.reply({
        embeds: [
            {
                title: 'Pong! :ping_pong:',
                fields: [
                    {
                        name: 'Ping',
                        value: `${clientPing}ms`,
                    },
                    {
                        name: 'Latency',
                        value: `${latency}ms`,
                    },
                ],
            },
        ],
        flags: 'Ephemeral',
    });
};
