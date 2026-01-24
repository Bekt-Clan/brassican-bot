import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    Client,
    Collection,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
} from 'discord.js';

import { Environment } from './services/environment';

type DiscordCommandDetails = {
    name: string;
    once?: boolean;
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => Promise<void>;
};

type DiscordEventDetails = {
    name: string;
    once?: boolean;
    execute: (...args: unknown[]) => Promise<void>;
};

export type ModifiedDiscordClient = Client & {
    commands?: Collection<string, DiscordCommandDetails>;
};

let client: ModifiedDiscordClient;

export const initialize = async () => {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    // Load all commands from dir/subdirs on start
    client.commands = new Collection();
    const foldersPath = path.join(path.resolve(), 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter(
                (file) => file.endsWith('.ts') && !file.endsWith('.test.ts')
            );
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command: DiscordCommandDetails = await import(
                `file://${filePath}`
            );

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(
                    `[WARNING] (RUN) The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }

    // Load all event handlers from dir on start
    const eventsPath = path.join(path.resolve(), 'events');
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith('.ts'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event: DiscordEventDetails = await import(`file://${filePath}`);

        if (event.once) {
            client.once(event.name, (...args: unknown[]) =>
                event.execute(...args)
            );
        } else {
            client.on(event.name, (...args: unknown[]) =>
                event.execute(...args)
            );
        }
    }

    // Re-deploy the commands to Discord

    const rest = new REST().setToken(Environment.DISCORD_BOT_TOKEN);

    try {
        console.log(
            `Started refreshing ${client.commands?.size || 0} application (/) commands.`
        );

        // TODO: Remove this deletion once the code has run in prod at least once
        // Delete all existing global commands
        await rest
            .put(Routes.applicationCommands(Environment.DISCORD_APP_ID), {
                body: [],
            })
            .then(() =>
                console.log('Successfully deleted all global commands.')
            )
            .catch(console.error);

        // Fully redeploy all commands at the guild level
        const data = await rest.put(
            Routes.applicationGuildCommands(
                Environment.DISCORD_APP_ID,
                Environment.GUILD_ID
            ),
            {
                body: Array.from(client.commands, ([_, details]) =>
                    (details as DiscordCommandDetails).data.toJSON()
                ),
            }
        );

        console.log(
            `Successfully reloaded ${(data as unknown[])?.length || 0} application (/) commands.`
        );
    } catch (error) {
        console.error('Could not reload commands:', error);
    }

    await client.login(Environment.DISCORD_BOT_TOKEN);
};

export const getDiscordClient = () => {
    return client;
};
