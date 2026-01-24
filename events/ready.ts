import { Client, Events } from 'discord.js';

export const name = Events.ClientReady;

export const once = true;

export const execute = (client: Client) => {
    client.application!.emojis.fetch();
    console.log(`Brassican Bot Booted! Logged in as ${client.user?.tag}`);
};
